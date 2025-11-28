import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
});

export const PineconeIndex = pinecone.Index(
  process.env.PINECONE_INDEX_NAME || ""
);

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function embedQuery(text: string) {
  const embedding = await pinecone.inference.embed(
    "llama-text-embed-v2",
    [text],
    { inputType: "query" }
  );

  const values =
    embedding.data[0]?.vectorType === "dense" ? embedding.data[0]?.values : [];
  return values;
}
