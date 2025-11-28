import json
import boto3
import os
from pinecone import Pinecone
from PyPDF2 import PdfReader
from io import BytesIO
import psycopg2
from psycopg2.extras import RealDictCursor
import traceback
import unicodedata

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Initialize clients
s3_client = boto3.client('s3')
pc = Pinecone(api_key=os.environ['PINECONE_API_KEY'])
index = pc.Index(os.environ['PINECONE_INDEX_NAME'])

# ---------------------------
# Utility Functions
# ---------------------------

def log(msg, **extra):
    """Clean structured logging"""
    print(json.dumps({"message": msg, **extra}))

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def update_file_status(file_id, status):
    log("Updating file status", file_id=file_id, status=status)
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                'UPDATE documents SET status = %s, "updatedAt" = NOW() WHERE id = %s',
                (status, file_id)
            )
            conn.commit()
    finally:
        conn.close()

def chunk_text(text, chunk_size=800, overlap=150):
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


# ---------------------------
# FIXED UTF-8 SAFE CLEANING
# ---------------------------

def normalize_text(t: str):
    """Strong normalization: remove ALL non-UTF8-safe chars, bullets, symbols."""
    if not t:
        return ""

    # Basic replacements
    replacements = {
        "’": "'",
        "‘": "'",
        "“": "\"",
        "”": "\"",
        "–": "-",
        "—": "-",
        "•": "-",
        "●": "-",  # <--- FIX for your current error
        "\xa0": " "
    }
    for bad, good in replacements.items():
        t = t.replace(bad, good)

    # Remove ANY character not encodable in Latin-1 (Pinecone HTTP fallback)
    safe_chars = []
    for ch in t:
        try:
            ch.encode("latin-1")
            safe_chars.append(ch)
        except:
            safe_chars.append(" ")  # replace unsupported chars with space

    t = "".join(safe_chars)

    # Final UTF-8 normalization
    t = unicodedata.normalize("NFKD", t)
    t = t.encode("utf-8", "ignore").decode("utf-8", "ignore")

    return t.strip()

def extract_text_from_pdf(pdf_bytes):
    """Extract text from PDF bytes"""
    pdf_file = BytesIO(pdf_bytes)
    pdf_reader = PdfReader(pdf_file)

    log("Extracting text from PDF", total_pages=len(pdf_reader.pages))

    pages = []
    for page_num, page in enumerate(pdf_reader.pages):
        try:
            text = page.extract_text() or ""
        except Exception:
            log("Failed extracting text from a page", page=page_num+1)
            text = ""
        pages.append({"page": page_num+1, "text": text})

    return pages

# ---------------------------
# Main Handler
# ---------------------------

def ingestPdf(event, context):
    file_id = None

    try:
        log("Lambda triggered", raw_event=event)

        sns_message = json.loads(event['Records'][0]['Sns']['Message'])
        log("Parsed SNS message", sns=sns_message)

        s3_bucket = sns_message['bucket']
        s3_key = sns_message['key']
        file_id = sns_message['fileId']
        user_id = sns_message['userId']

        log("Starting ingestion", file_id=file_id, user_id=user_id, bucket=s3_bucket, key=s3_key)

        update_file_status(file_id, 'processing')

        # Download PDF
        log("Downloading PDF from S3", bucket=s3_bucket, key=s3_key)
        response = s3_client.get_object(Bucket=s3_bucket, Key=s3_key)
        pdf_bytes = response['Body'].read()
        log("PDF downloaded", size_bytes=len(pdf_bytes))

        # Extract text
        pages = extract_text_from_pdf(pdf_bytes)
        log("PDF text extraction finished", pages=len(pages))

        documents = []
        chunk_id = 0

        # Chunk text
        for page_data in pages:
            page_num = page_data['page']
            text = page_data['text'] or ""

            page_chunks = chunk_text(text)
            log("Chunking page", page=page_num, chunks=len(page_chunks))

            for chunk in page_chunks:
                cleaned = normalize_text(chunk)
                if cleaned:
                    documents.append({
                        'id': f"{file_id}#{chunk_id}",
                        'text': cleaned,
                        'metadata': {
                            'fileId': file_id,
                            'userId': user_id,
                            'chunkIndex': chunk_id,
                            'pageNumber': page_num,
                            'text': cleaned
                        }
                    })
                    chunk_id += 1

        log("Text chunking complete", total_chunks=len(documents))

        # Generate embeddings
        texts = [doc['text'] for doc in documents]
        log("Generating embeddings", count=len(texts))

        embeddings = pc.inference.embed(
            model="llama-text-embed-v2",
            inputs=texts,
            parameters={"input_type": "passage"}
        )

        log("Embeddings generated", vector_count=len(embeddings))

        # Prepare vectors
        vectors = []
        for i, doc in enumerate(documents):
            vectors.append({
                'id': doc['id'],
                'values': embeddings[i]['values'],
                'metadata': doc['metadata']
            })

        # Upsert in batches
        namespace = f"user_{user_id}"
        BATCH_SIZE = 100

        log("Starting Pinecone upsert", namespace=namespace, total_vectors=len(vectors))

        for i in range(0, len(vectors), BATCH_SIZE):
            batch = vectors[i:i + BATCH_SIZE]
            log("Upserting batch", start=i, end=i+len(batch))
            index.upsert(vectors=batch, namespace=namespace)

        log("All vectors upserted")

        update_file_status(file_id, 'completed')

        log("Ingestion successfully completed", file_id=file_id)

        return {}  # SNS doesn't expect a response

    except Exception as e:
        log("Error occurred during ingestion", error=str(e), traceback=traceback.format_exc())

        if file_id:
            update_file_status(file_id, 'failed')

        raise e  # trigger SNS retry