import "dotenv/config";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { HydeRetriever } from "@langchain/classic/retrievers/hyde";

export async function runChat(userQuery, userId) {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  // Ready the client OpenAI Embedding Model
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  // connects to already existing Qdrant collection
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY || undefined,
      collectionName: "rag-assignment",
    },
    // {
    //   url: "http://localhost:6333",
    //   collectionName: "rag-assignment",
    // },
  );

  const searchOptions = {
    filter: {
      must: [{ key: "metadata.userId", match: { value: userId } }],
    },
  };
  // console.log("searchOptions", searchOptions.filter.must[0].match);

  const retriever = new HydeRetriever({
    vectorStore,
    llm,
    k: 1,
    filter: searchOptions.filter,
  });

  const results = await retriever.invoke(userQuery);
  // console.log(`User ID: ${userId}`);
  // console.log(`Documents found: ${results.length}`);
  // console.log("HyDE answer:", results);

  if (results.length === 0) {
    return {
      answer:
        "I'm sorry, I don't have any documents in your account to answer that.",
      files: [],
    };
  }
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

  // - You may add widely known background information, but clearly separate it from sourced information.

  const finalAnswer = await llm.invoke([
    {
      role: "system",
      content: `
        You are a helpful assistant.

        HTML STRUCTURE RULES:
     - Use <b> for main section titles.
     - Use <p class="pb-2"> for standard paragraphs.
     - Use <ul class="list-disc"> and <li> for lists.
     - Use <br> for line breaks between sections.
     - DO NOT use Markdown symbols like ** or ###.
     - DO NOT use <html>, <body>, or <head> tags; only provide the inner content.
     
        Rules:
- Use the provided information as the primary source.
- NEVER use your own background knowledge, general facts, or outside information.
- When information is sourced, must include the page number in the format (page X).
- Do not invent page numbers.
- If the question asks for an explanation, impact, reasons, or considerations, provide a detailed answer with multiple points.
- If the question is a simple identity or definition question, respond in a single concise sentence.
- Organize detailed answers using short paragraphs or bullet points.
- If the provided information does not contain the answer, clearly say so.
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

  // console.log("final ", finalAnswer.content);
  return {
    answer: finalAnswer.content,
  };
}
