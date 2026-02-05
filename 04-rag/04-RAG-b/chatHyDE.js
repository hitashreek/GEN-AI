import "dotenv/config";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HydeRetriever } from "@langchain/classic/retrievers/hyde";
// import OpenAI from "openai";

async function chat() {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  const userQuery = "who is thomas edison?";

  // Ready the client OpenAI Embedding Model
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // connects to already existing Qdrant collection
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: "http://localhost:6333",
      collectionName: "rag-assignment",
    },
  );

  const retriever = new HydeRetriever({
    vectorStore,
    llm,
    k: 1,
  });

  const results = await retriever.invoke(userQuery);

  // console.log("HyDE answer:", results);

  const context = results
    .map((r) => {
      const source = r.metadata?.source ?? "file";

      const page =
        r.metadata?.loc?.pageNumber !== undefined
          ? r.metadata.loc.pageNumber
          : "unknown";

      return `(${source}, page ${page})\n${r.pageContent}`;
    })
    .join("\n\n");

  const finalAnswer = await llm.invoke([
    {
      role: "system",
      content: `
        You are a helpful assistant.

        Rules:
- Use the provided information as the primary source.
- You may add widely known background information, but clearly separate it from sourced information.
- When information is sourced, include the page number in the format (page X).
- Do not invent page numbers.
- If the question asks for an explanation, impact, reasons, or considerations, provide a detailed answer with multiple points.
- If the question is a simple identity or definition question, respond in a single concise sentence.
- Organize detailed answers using short paragraphs or bullet points.
- Do not mention the words context or document.
      `,
    },
    {
      role: "user",
      content: `
        Answer the question clearly and naturally using the information below.

        Question:
        ${userQuery}

        Sources:
        ${context}
      `,
    },
  ]);

  console.log(finalAnswer.content);
}

chat();
