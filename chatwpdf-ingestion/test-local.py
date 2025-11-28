"""
Local testing script for the Lambda function
This allows you to test the handler without deploying to AWS
"""
import json
from handler import ingestPdf

# Create a mock SNS event
event = {
    "Records": [
        {
            "EventSource": "aws:sns",
            "Sns": {
                "Message": json.dumps({
                    "bucket": "imm-user-images",
                    "key": "uploads/sample.pdf",
                    "fileId": "207d3550-2cb7-423b-95d8-105a60f5c937",
                    "userId": "ec677df8-f74b-413d-abe0-0d316b0276d3"
                })
            }
        }
    ]
}

# Create a mock context (Lambda context object)
class MockContext:
    def __init__(self):
        self.function_name = "test-function"
        self.memory_limit_in_mb = 128
        self.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test"
        self.aws_request_id = "test-request-id"

context = MockContext()

# Invoke the handler
if __name__ == "__main__":
    print("Testing Lambda function locally...")
    print("\nEvent:")
    print(json.dumps(event, indent=2))
    print("\n" + "="*50 + "\n")
    
    result = ingestPdf(event, context)
    
    print("\nResult:")
    print(json.dumps(result, indent=2))

