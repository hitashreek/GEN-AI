"use client";

import { useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { RealtimeSession } from "@openai/agents-realtime";
import { createAgent } from "./agents/gf";

export default function Home() {
  const sessionRef = useRef<RealtimeSession | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // START MIC + AGENT
  const startAgent = async () => {
    try {
      setIsLoading(true);

      // Explicit mic permission (user gesture)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Get temporary ephemeral API key from backend
      const { data } = await axios.get("/api");
      const tempKey = data.tempApiKey;

      // Create realtime session
      const session = new RealtimeSession(await createAgent(), {
        model: "gpt-realtime",
        config: {
          inputAudioFormat: "pcm16",
          inputAudioNoiseReduction: { type: "near_field" },
          inputAudioTranscription: {
            language: "en",
            model: "gpt-4o-mini-transcribe",
          },
        },
      });

      // Connect
      await session.connect({ apiKey: tempKey });

      sessionRef.current = session;
      setIsActive(true);
    } catch (err) {
      console.error("Failed to start agent:", err);
      alert("Mic permission or connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  // STOP MIC + AGENT
  const stopAgent = async () => {
    try {
      // Stop microphone
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      // Disconnect agent
      sessionRef.current?.close();
      sessionRef.current = null;
    } catch (err) {
      console.error("Failed to stop agent:", err);
    } finally {
      setIsActive(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 font-sans">
      <h1 className="text-2xl font-semibold">Realtime Voice Agent</h1>

      {!isActive ? (
        <button
          onClick={startAgent}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? "Connecting..." : "Start Talking"}
        </button>
      ) : (
        <button
          onClick={stopAgent}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 text-white hover:bg-red-700"
        >
          End
        </button>
      )}

      <p className="text-sm text-gray-500">
        Mic permission is requested only when you click the button
      </p>
    </div>
  );
}
