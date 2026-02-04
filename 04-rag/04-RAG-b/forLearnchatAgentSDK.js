import "dotenv/config";
import OpenAI from "openai";
import { Agent, tool, run } from "@openai/agents";
import { QdrantClient } from "@qdrant/js-client-rest";

const openai = new OpenAI();
const qdrant = new QdrantClient({ url: "http://localhost:6333" });

// Retrieval tool
const retrieveFromPdf = tool({
  name: "retrieve_from_pdf",
  description:
    "Retrieve relevant text chunks (with page numbers) extracted from PDFs and stored in Qdrant",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string" },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async execute({ query }) {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: query,
    });

    const queryVector = embeddingResponse.data[0].embedding;

    const results = await qdrant.search("rag-assignment", {
      vector: queryVector,
      limit: 3,
    });

    return results
      .filter((r) => r.score > 0.25)
      .map(
        (r) => ` 
        content: ${r.payload?.content},
        source_page: ${r.payload?.page},
        relevance_score: ${r.score},
      `,
      );
  },
});

// Agent
const ragAgent = new Agent({
  name: "PDF RAG Agent",
  model: "gpt-4o-mini",
  instructions: `
    You are an AI assistant who helps resolving user query based on the
    context available to you from a PDF file with the content and page number.

    Only ans based on the available context from file only.
`,
  tools: [retrieveFromPdf],
});

// Run agent
const userQuery = "Which bag will I receive?";
const result = await run(ragAgent, userQuery);

console.log("Ans", result.state._currentStep.output);
