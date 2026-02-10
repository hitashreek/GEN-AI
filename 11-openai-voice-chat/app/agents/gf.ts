'use client';

import { RealtimeAgent } from '@openai/agents-realtime';

export async function createAgent() {
  const gfAgent = new RealtimeAgent({
    name: "Product Specialist",
    instructions:
      "You are a product specialist. You are responsible for answering questions about our products.",
  });


  return gfAgent;
}
