"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { SYSTEM_PROMPT, EVALUATION_RUBRIC } from "../prompts";
import { ChatMessage } from "@/types/chat";

const InterviewDurationMs = 10 * 60 * 1000; // 3 minutes

export default function VoiceInterview() {
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);
  const [lastUser, setLastUser] = useState<string>("");
  const [assistant, setAssistant] = useState<string>("");
  const [log, setLog] = useState<string>("");
  const [finalEval, setFinalEval] = useState<string>("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [recognizing, setRecognizing] = useState(false);

  const [remainingMs, setRemainingMs] = useState(InterviewDurationMs);

  // ---- STT ----
  const stopSTT = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecognizing(false);
    }
  }, []);

  const startSTT = useCallback(() => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("SpeechRecognition not supported in this browser.");
        return;
      }
      const recog: SpeechRecognition = new SpeechRecognition();
      recog.continuous = true;
      recog.interimResults = true;
      recog.lang = "en-US";
      recog.onresult = (ev: SpeechRecognitionEvent) => {
        let finalText = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript;
        }
        if (finalText) {
          setLastUser(finalText);
        }
      };
      recog.onend = () => setRecognizing(false);
      recognitionRef.current = recog;
    }
    if (!recognizing) {
      recognitionRef.current!.start();
      setRecognizing(true);
    }
  }, [recognizing]);

  // ---- TTS ----
  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      stopSTT();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 1;
      u.pitch = 1;
      u.onend = () => {
        if (running) startSTT();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [running, startSTT, stopSTT]
  );

  // ---- Backend Call ----
  const callLLM = useCallback(async (newMessages: ChatMessage[], evaluate = false) => {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: newMessages, evaluate }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.reply as string;
  }, []);

  // ---- Handle user input ----
  useEffect(() => {
    if (!lastUser || !running) return;
    const go = async () => {
      try {
        const newMsgs: ChatMessage[] = [...messages, { role: "user", content: lastUser }];
        setMessages(newMsgs);
        setLastUser("");
        const reply = await callLLM(newMsgs);
        setAssistant(reply);
        setMessages([...newMsgs, { role: "assistant", content: reply }]);
        speak(reply);
      } catch (e: any) {
        setLog("Error: " + e.message);
      }
    };
    go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUser]);

  // ---- Timer ----
  useEffect(() => {
    if (!running || !startedAt) return;

    const id = setInterval(() => {
      const diff = Date.now() - startedAt;
      const left = Math.max(0, InterviewDurationMs - diff);
      setRemainingMs(left);

      if (left <= 0) {
        clearInterval(id);
        finishInterview();
      }
    }, 1000);

    return () => clearInterval(id);
  }, [running, startedAt]);

  // ---- Finish Interview & Generate Evaluation ----
  const finishInterview = async () => {
    setRunning(false);
    stopSTT();
    try {
      const evalMsgs: ChatMessage[] = [
        ...messages,
        { role: "system", content: EVALUATION_RUBRIC },
        { role: "user", content: "Please generate a final evaluation." },
      ];
      const evalText = await callLLM(evalMsgs, true);
      setFinalEval(evalText);
    } catch (e: any) {
      setLog("Evaluation Error: " + e.message);
    }
  };

  // ---- Start Interview ----
  const startInterview = async () => {
    setStartedAt(Date.now());
    setRemainingMs(InterviewDurationMs);
    setFinalEval("");
    setRunning(true);
    setMessages([{ role: "system", content: SYSTEM_PROMPT }]);
    try {
      const reply = await callLLM([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Let's begin the interview." },
      ]);
      setAssistant(reply);
      setMessages([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Let's begin the interview." },
        { role: "assistant", content: reply },
      ]);
      speak(reply);
    } catch (e: any) {
      setLog("Error: " + e.message);
    }
  };

  return (
    <div className="relative w-full max-w-3xl bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl p-6 border border-white/20">
      {/* Header */}
      <h2 className="text-3xl font-extrabold text-center bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-6">
        🚀 AI Interview Session
      </h2>

      {/* Status Bar */}
      <div className="flex justify-between items-center mb-6">
        <span
          className={`px-4 py-2 rounded-full text-sm font-bold shadow-md ${
            running
              ? "bg-green-500/20 text-green-400 border border-green-400 animate-pulse"
              : finalEval
              ? "bg-blue-500/20 text-blue-400 border border-blue-400"
              : "bg-gray-500/20 text-gray-400 border border-gray-400"
          }`}
        >
          {running ? "Interview Running" : finalEval ? "Finished" : "Idle"}
        </span>
        <span className="px-4 py-2 rounded-full bg-black/30 border border-cyan-400 text-cyan-400 font-mono shadow-lg">
          ⏱ {Math.floor(remainingMs / 60000)}:
          {Math.floor((remainingMs % 60000) / 1000).toString().padStart(2, "0")}
        </span>
      </div>

      {/* Controls */}
      {!running && !finalEval && (
        <button
          onClick={startInterview}
          className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-500 text-white shadow-lg hover:opacity-90 transition"
        >
          Start Interview
        </button>
      )}

      {running && (
        <div className="flex justify-center my-6">
          <button
            onClick={startSTT}
            disabled={recognizing}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-2xl transition relative ${
              recognizing
                ? "bg-red-500 text-white animate-pulse"
                : "bg-gradient-to-r from-purple-600 to-cyan-500 text-white hover:scale-105"
            }`}
          >
            {recognizing ? "🎙" : "🎤"}
            {recognizing && (
              <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></span>
            )}
          </button>
        </div>
      )}

      {/* Transcript */}
      <div className="h-72 overflow-y-auto bg-black/30 border border-white/10 rounded-xl p-4 space-y-4 shadow-inner">
        {messages
          .filter((m) => m.role !== "system")
          .map((m, i) => (
            <div
              key={i}
              className={`flex ${
                m.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-3 rounded-2xl max-w-[75%] text-sm shadow-md ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border border-cyan-300"
                    : "bg-white/10 text-purple-200 border border-purple-400"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
      </div>

      {/* Evaluation */}
      {finalEval && (
        <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-green-500/20 via-green-600/10 to-emerald-500/20 border border-green-400 shadow-xl">
          <h3 className="text-xl font-extrabold text-green-400 mb-2">
            ✅ Final Evaluation
          </h3>
          <p className="whitespace-pre-wrap text-white/90">{finalEval}</p>
        </div>
      )}

      {/* Logs */}
      {log && <p className="text-red-400 text-sm mt-4">{log}</p>}
    </div>
  );
}
