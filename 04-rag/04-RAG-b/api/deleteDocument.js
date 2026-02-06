import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";

/**
 * Delete all chunks of a specific document for a user
 * @param {string} userId - The user ID
 * @param {string} source - The document source to delete
 * @returns {Object} Deletion result
 */
export async function deleteUserDocument(userId, source) {
  const qdrantClient = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY || undefined,
  });

  // Delete all points matching both userId AND source
  const result = await qdrantClient.delete("rag-assignment", {
    filter: {
      must: [
        { key: "metadata.userId", match: { value: userId } },
        { key: "metadata.source", match: { value: source } },
      ],
    },
  });

  // console.log(`Deleted document: ${source} for user: ${userId}`);
  return result;
}
