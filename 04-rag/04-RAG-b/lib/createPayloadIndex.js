import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY || undefined,
});

const collectionName = "rag-assignment";

async function createPayloadIndexes() {
  const fields = ["metadata.userId", "metadata.source"];

  try {
    const collection = await client.getCollection(collectionName);

    for (const fieldName of fields) {
      const existingIndex = collection.payload_schema?.[fieldName];

      if (existingIndex?.data_type === "keyword") {
        console.log(`Index already exists: ${fieldName}`);
        continue;
      }

      await client.createPayloadIndex(collectionName, {
        field_name: fieldName,
        field_schema: "keyword",
        wait: true,
      });

      console.log(`Created keyword index: ${fieldName}`);
    }
  } catch (error) {
    console.error("Failed to create indexes:", error.message);
    process.exitCode = 1;
  }
}

createPayloadIndexes();

// createPayloadIndex creates an index on a Qdrant payload field so Qdrant can efficiently filter documents using that field.
