import express from "express";
import cors from "cors";
import multer from "multer";
import { runIndexing } from "./api/indexing.js"; // your indexing logic
import { runChat } from "./api/chatHyDE.js";

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
  if (!req.file) {
    return res.status(400).json({ error: "No document uploaded" });
  }

  const userId = req.body.userId || "demo-user-123";
  const fileBuffer = req.file.buffer;
  const fileName = req.file.originalname;

  try {
    await runIndexing(userId, fileBuffer, fileName);
    res.json({ message: "Indexing complete!" });
  } catch (err) {
    console.error("Indexing error:", err);
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
    const result = await runChat(query, userId || "demo-user-123");
    res.json(result);
  } catch (err) {
    console.error("Chat error:", err);
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
