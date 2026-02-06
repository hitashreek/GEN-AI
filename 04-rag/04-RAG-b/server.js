import express from "express";
import cors from "cors";
import multer from "multer";
import { runIndexing } from "./api/indexing.js";
import { runChat } from "./api/chatHyDE.js";
import { getUserDocuments } from "./api/getUserDocuments.js";
import { deleteUserDocument } from "./api/deleteDocument.js";

const app = express();

// memory storage is GOOD for Vercel
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.use(cors());
app.use(express.json());

// PDF / TXT Indexing endpoint
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
      await runIndexing(userId, req.file.buffer, req.file.originalname);
    } else {
      await runIndexing(userId, null, null, textContent);
    }

    res.json({ message: "Indexing complete!" });
  } catch (err) {
    console.error("Indexing error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/documents/:userId", async (req, res) => {
  try {
    const documents = await getUserDocuments(req.params.userId);
    res.json({ documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/chatHyDE", async (req, res) => {
  try {
    const result = await runChat(req.body.query, req.body.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/documents/:userId/:source", async (req, res) => {
  try {
    const result = await deleteUserDocument(
      req.params.userId,
      req.params.source,
    );
    res.json({ message: "Document deleted successfully", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// health check
app.get("/api/health", (_, res) => {
  res.json({ status: "ok" });
});

// LOCAL RUN ONLY
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
