import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const sns = new SNSClient({ region: process.env.AWS_REGION });

export async function triggerSNS({
  bucket,
  key,
  fileId,
  userId,
}: {
  bucket: string;
  key: string;
  fileId: string;
  userId: string;
}) {
  const message = { bucket, key, fileId, userId };

  const command = new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN || "",
    Message: JSON.stringify(message),
  });

  try {
    const res = await sns.send(command);
    console.log("SNS published:", res);
    return res;
  } catch (error) {
    console.error("Error publishing to SNS:", error);
    throw error; // so your route can catch and respond correctly
  }
}
