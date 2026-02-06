import express from "express";
import cors from "cors";
import multer from "multer";
import { runIndexing } from "./api/indexing.js";
import { runChat } from "./api/chatHyDE.js";
import { getUserDocuments } from "./api/getUserDocuments.js";
import { deleteUserDocument } from "./api/deleteDocument.js";

const app = express();

// use memory storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// ---------------------------
// PDF / TXT Indexing endpoint
// ---------------------------
app.post("/api/indexing", upload.single("pdf"), async (req, res) => {
  const userId = req.body.userId;
  const textContent = req.body.textContent;

  if (!req.file && !textContent) {
    return res.status(400).json({ error: "No document or text provided" });
  }

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    if (req.file) {
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;
      await runIndexing(userId, fileBuffer, fileName);
    } else if (textContent) {
      await runIndexing(userId, null, null, textContent);
    }

    res.json({ message: "Indexing complete!" });
  } catch (err) {
    console.error("Indexing error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Get user's documents
// ---------------------------
app.get("/api/documents/:userId", async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const documents = await getUserDocuments(userId);
    res.json({ documents });
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// HyDE Chat Endpoint
// ---------------------------
app.post("/api/chatHyDE", async (req, res) => {
  const { query, userId } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const result = await runChat(query, userId);
    res.json(result);
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Delete document endpoint
// ---------------------------
app.delete("/api/documents/:userId/:source", async (req, res) => {
  const { userId, source } = req.params;

  if (!userId || !source) {
    return res.status(400).json({ error: "userId and source are required" });
  }

  try {
    const result = await deleteUserDocument(userId, source);
    res.json({ message: "Document deleted successfully", result });
  } catch (err) {
    console.error("Error deleting document:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------
// Start Server
// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});
