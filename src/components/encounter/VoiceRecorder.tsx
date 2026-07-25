"use client";

import { useState, useRef, useEffect } from "react";
import { transcribeAudio } from "@/lib/ai/client";

interface VoiceRecorderProps {
  onRecordingComplete: (blob: Blob, url: string, transcript: string) => void;
  onClear: () => void;
  initialAudioUrl?: string | null;
  initialTranscript?: string | null;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onClear,
  initialAudioUrl,
  initialTranscript,
}: VoiceRecorderProps) {
  const [recordState, setRecordState] = useState<"idle" | "recording" | "processing" | "stopped">(
    initialAudioUrl || initialTranscript ? "stopped" : "idle"
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState(initialTranscript || "");
  const [statusMsg, setStatusMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  async function startRecording() {
    try {
      setRecordState("recording");
      setStatusMsg("Recording audio...");
      audioChunksRef.current = [];

      let selectedMimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) selectedMimeType = "audio/webm;codecs=opus";
      else if (MediaRecorder.isTypeSupported("audio/mp4")) selectedMimeType = "audio/mp4";

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const draw = () => {
          analyser.getByteFrequencyData(dataArray);
          const sum = dataArray.reduce((a, b) => a + b, 0);
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
          if (recordState === "recording") {
            animationFrameRef.current = requestAnimationFrame(draw);
          }
        };
        draw();
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setRecordState("processing");
        setStatusMsg("Processing audio...");
        setAudioLevel(0);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());

        const actualMime = mediaRecorder.mimeType || selectedMimeType;
        const audioBlobObj = new Blob(audioChunksRef.current, { type: actualMime });
        const url = URL.createObjectURL(audioBlobObj);
        
        setAudioUrl(url);

        try {
          const text = await transcribeAudio(audioBlobObj);
          setTranscript(text);
          setStatusMsg("Recording saved and transcribed.");
          onRecordingComplete(audioBlobObj, url, text);
        } catch (e) {
          setStatusMsg("Transcription failed.");
          onRecordingComplete(audioBlobObj, url, "");
        }
        setRecordState("stopped");
      };

      mediaRecorder.start(200);
    } catch (e) {
      console.error(e);
      setRecordState("idle");
      setStatusMsg("Microphone permission denied.");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function clearRecording() {
    setRecordState("idle");
    setAudioUrl(null);
    setTranscript("");
    setStatusMsg("");
    onClear();
  }

  return (
    <div style={{ background: "#ffffff", borderRadius: "16px", padding: "20px", border: "1px solid #e4e4e7" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "16px", color: "#18181b" }}>Audio Consultation</h3>
        {statusMsg && <span style={{ fontSize: "12px", color: "#71717a" }}>{statusMsg}</span>}
      </div>

      {recordState === "idle" && (
        <button onClick={startRecording} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🎤</span> Start Recording
        </button>
      )}

      {recordState === "recording" && (
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button onClick={stopRecording} style={{ flex: 1, padding: "14px", borderRadius: "12px", background: "#ef4444", color: "white", border: "none", fontWeight: 700, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }}>
            <span style={{ width: "12px", height: "12px", background: "white", borderRadius: "2px" }} /> Stop Recording
          </button>
          <div style={{ flex: 1, height: "40px", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", background: "#ef4444", width: `${audioLevel}%`, transition: "width 0.1s linear" }} />
          </div>
        </div>
      )}

      {recordState === "processing" && (
        <div style={{ padding: "14px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
          Processing audio and transcribing...
        </div>
      )}

      {recordState === "stopped" && audioUrl && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <audio src={audioUrl} controls style={{ width: "100%", height: "40px" }} />
          {transcript && (
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "14px", color: "#334155", fontStyle: "italic" }}>
              "{transcript}"
            </div>
          )}
          <button onClick={clearRecording} style={{ padding: "10px", borderRadius: "8px", background: "transparent", color: "#ef4444", border: "1px solid #fecaca", fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}>
            Clear & Re-record
          </button>
        </div>
      )}
    </div>
  );
}
