import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";

/**
 * Run indexing on a PDF file buffer or raw text content
 * @param {string} userId - The user ID to tag the documents
 * @param {Buffer} fileBuffer - The PDF file contents in memory
 * @param {string} fileName - The original filename
 * @param {string|null} textContent - Raw text content (optional)
 */
export async function runIndexing(userId, fileBuffer, fileName, textContent) {
  let docs;
  let tempFilePath = null;

  if (fileBuffer && fileName) {
    // Handle PDF file upload
    const ext = path.extname(fileName).toLowerCase();

    if (ext === ".pdf") {
      const tempDir = "/tmp";
      const tempPath = path.join(tempDir, fileName);
      // const safeFileName = `${userId}-${Date.now()}-${fileName}`;
      // const tempPath = path.join(tempDir, safeFileName);
      fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(tempPath, fileBuffer);

      const loader = new PDFLoader(tempPath);

      tempFilePath = tempPath;
      docs = await loader.load();
    } else {
      throw new Error(
        `Unsupported file type: ${ext}. Only PDF files are supported.`,
      );
    }
  } else if (textContent) {
    // Handle raw text content from textarea
    const source = `text-input${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    docs = [
      new Document({
        pageContent: textContent,
        metadata: {
          source,
        },
      }),
    ];
  } else {
    throw new Error("Either PDF file or text content must be provided");
  }

  // Add userId to all documents
  const userScopedDocs = docs.map((doc) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      source: fileName,
      userId,
    },
  }));

  // OpenAI Embeddings
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // Push to Qdrant collection
  await QdrantVectorStore.fromDocuments(userScopedDocs, embeddings, {
    url: "http://localhost:6333",
    collectionName: "rag-assignment",
  });

  console.log(
    `Indexing done. ${userScopedDocs.length} documents are now tagged with userId: ${userId}`,
  );

  // Clean up temp file if it exists
  if (tempFilePath && fs.existsSync(tempFilePath)) {
    fs.unlinkSync(tempFilePath);
  }
}
