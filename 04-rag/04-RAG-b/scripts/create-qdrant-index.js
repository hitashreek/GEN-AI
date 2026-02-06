import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

async function createIndexes() {
  await client.createPayloadIndex("rag-assignment", {
    field_name: "metadata.userId",
    field_schema: "keyword",
  });

  await client.createPayloadIndex("rag-assignment", {
    field_name: "metadata.source",
    field_schema: "keyword",
  });

  console.log("Payload indexes created");
}

createIndexes();
