import "dotenv/config";
import { QdrantClient } from "@qdrant/js-client-rest";
import path from "path"; // ADD THIS IMPORT

/**
 * Fetch all documents for a specific user from Qdrant
 * @param {string} userId - The user ID
 * @returns {Array} Array of document objects with metadata and preview
 */
export async function getUserDocuments(userId) {
  const qdrantClient = new QdrantClient({ url: "http://localhost:6333" });

  const searchOptions = {
    filter: {
      must: [{ key: "metadata.userId", match: { value: userId } }],
    },
  };

  // Fetch all user documents
  const result = await qdrantClient.scroll("rag-assignment", {
    filter: searchOptions.filter,
    limit: 100,
    with_payload: true,
    with_vector: false,
  });

  // Separate handling for text vs PDF
  const textChunks = [];
  const pdfMap = new Map();

  result.points.forEach((point) => {
    const metadata = point.payload?.metadata || {};
    const source = metadata.source || "unknown";
    const pageContent = point.payload?.content || "";

    if (source.startsWith("text-input")) {
      // For text: Create separate entry for each chunk
      const preview =
        pageContent.substring(0, 100) + (pageContent.length > 100 ? "..." : "");

      textChunks.push({
        source: source,
        type: "text",
        content: pageContent,
        preview: preview,
        chunkId: point.id,
      });
    } else {
      // For PDF: Group by filename
      // CHANGED: Extract just the filename from the path
      const fileName = path.basename(source);

      if (!pdfMap.has(fileName)) {
        pdfMap.set(fileName, {
          source: fileName, // Use just the filename
          type: "pdf",
          fullContent: pageContent,
          chunks: 1,
        });
      } else {
        const existing = pdfMap.get(fileName);
        existing.chunks += 1;
        if (pageContent) {
          existing.fullContent += "\n\n" + pageContent;
        }
      }
    }
  });

  // Process PDFs to add preview
  const pdfDocuments = Array.from(pdfMap.values()).map((doc) => {
    const preview =
      doc.fullContent.substring(0, 150) +
      (doc.fullContent.length > 150 ? "..." : "");

    return {
      source: doc.source,
      type: doc.type,
      preview: preview,
      chunks: doc.chunks,
      fullContent: null,
    };
  });

  // Combine text chunks and PDF documents
  return [...textChunks, ...pdfDocuments];
}
