import express from "express";
import { config } from "dotenv";
import OpenAI from "openai";
import cors from "cors";
import { hiteshPrompt, piyushPrompt, basePrompt } from "./promptMsg.js";
config(); // Load .env variables

const app = express();

app.use(
  cors({
    origin: ["http://localhost:4200", "https://02persona-chat-f.vercel.app/"], // frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running! Use POST /api/chat");
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { persona, userMessage } = req.body;

    if (!persona || !userMessage) {
      return res.status(400).json({ reply: "Invalid request body" });
    }

    let systemPrompt = "";
    if (persona === "hitesh") {
      systemPrompt = `${basePrompt}\n\n${hiteshPrompt}`;
    } else {
      systemPrompt = `${basePrompt}\n\n${piyushPrompt}`;
    }

    const rewrittenQuery = await rewriteQuery(client, userMessage);

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: rewrittenQuery,
        },
      ],
      temperature: 0,
      // max_tokens: 220,
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error("Chat API Error:", error);
    res.status(500).json({
      reply: "Server error occurred",
      details: error.message || "Unknown error",
    });
  }
});

// Export for Vercel
export default app;

// Local run
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

async function rewriteQuery(client, userMessage) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Rewrite the query query to be clear, specific. Do not add new information.`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 2,
    max_tokens: 100,
  });

  return res.choices[0].message.content.trim();
}
