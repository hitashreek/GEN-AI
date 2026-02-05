import "dotenv/config";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import fs from "fs";
import path from "path";

/**
 * Run indexing on a PDF or TXT file buffer
 * @param {string} userId - The user ID to tag the documents
 * @param {Buffer} fileBuffer - The file contents (PDF/TXT) in memory
 * @param {string} fileName - The original filename (needed to detect extension)
 */
export async function runIndexing(userId, fileBuffer, fileName) {
  // console.log("**", userId, fileBuffer, fileName);

  const ext = path.extname(fileName).toLowerCase();

  let loader;

  if (ext === ".pdf") {
    // PDFLoader expects a path, so we need to write the buffer to a temp file
    const tempPath = path.join("./uploads", fileName);
    // Make sure uploads folder exists
    fs.mkdirSync("./uploads", { recursive: true });
    fs.writeFileSync(tempPath, fileBuffer);
    loader = new PDFLoader(tempPath);
  } else if (ext === ".txt") {
    // TextLoader also expects a path
    const tempPath = path.join("./uploads", fileName);
    fs.mkdirSync("./uploads", { recursive: true });
    fs.writeFileSync(tempPath, fileBuffer);
    loader = new TextLoader(tempPath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const docs = await loader.load();

  const userScopedDocs = docs.map((doc) => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      userId,
    },
  }));

  // OpenAI Embeddings
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // Push to Qdrant collection
  const vectorStore = await QdrantVectorStore.fromDocuments(
    userScopedDocs,
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "rag-assignment",
    },
  );

  // console.log(
  //   `Indexing done. ${userScopedDocs.length} documents are now tagged with userId: ${userId}`,
  // );
  //  return
  // Optionally delete temp file to keep server clean
  if (loader.filePath && fs.existsSync(loader.filePath)) {
    fs.unlinkSync(loader.filePath);
  }
}
