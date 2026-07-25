"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AllergyBanner from "./AllergyBanner";
import { parseJson } from "@/lib/types";
import type { Allergy } from "@/lib/types";
import { transcribeAudio } from "@/lib/ai/client";

interface AttachedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  fileObj?: File;
}

type RecorderStatus = "idle" | "recording" | "paused" | "stopped";

export default function ComplaintStep({
  encounterId,
  patientAllergies,
  initialComplaint,
}: {
  encounterId: string;
  patientAllergies: string;
  initialComplaint?: {
    voiceTranscript?: string | null;
    audioUrl?: string | null;
    textInput?: string | null;
    images?: string;
    files?: string;
  } | null;
}) {
  const router = useRouter();
  const allergies = parseJson<Allergy[]>(patientAllergies, []);

  // Ambient Voice Recorder State
  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>(
    initialComplaint?.audioUrl || initialComplaint?.voiceTranscript ? "stopped" : "idle"
  );
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState(initialComplaint?.voiceTranscript || "");
  const [audioUrl, setAudioUrl] = useState<string | null>(initialComplaint?.audioUrl || null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);

  // Pharmacist Notes State
  const [textInput, setTextInput] = useState(initialComplaint?.textInput || "");

  // Attachment Menu & Files State
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFileItem[]>(() => {
    if (!initialComplaint) return [];
    try {
      const imgs: string[] = parseJson(initialComplaint.images || "[]", []);
      const fls: string[] = parseJson(initialComplaint.files || "[]", []);
      const imgItems: AttachedFileItem[] = imgs.map((name, i) => ({
        id: `saved-img-${i}`,
        name,
        size: 1024 * 500,
        type: "image",
        url: name,
      }));
      const fileItems: AttachedFileItem[] = fls.map((name, i) => ({
        id: `saved-file-${i}`,
        name,
        size: 1024 * 300,
        type: "document",
        url: name,
      }));
      return [...imgItems, ...fileItems];
    } catch {
      return [];
    }
  });

  // Review Modal & Saving State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewVoiceTranscript, setReviewVoiceTranscript] = useState("");
  const [reviewTextInput, setReviewTextInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Refs for Audio, AudioContext Visualizer, & Timers
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recorderStatusRef = useRef<RecorderStatus>(recorderStatus);

  useEffect(() => {
    recorderStatusRef.current = recorderStatus;
  }, [recorderStatus]);

  // Clean up timers & audio contexts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch (e) {}
      }
    };
  }, []);

  // START AUDIO RECORDING
  function startRecording() {
    setRecorderStatus("recording");
    setRecordingSeconds(0);
    setStatusMessage("Recording patient audio...");
    audioChunksRef.current = [];

    // Start Recording Timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Detect supported audio MIME type
    let selectedMimeType = "audio/webm";
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        selectedMimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        selectedMimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        selectedMimeType = "audio/ogg;codecs=opus";
      }
    }

    // Initialize MediaRecorder & Web Audio API Visualizer
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Web Audio API volume visualizer
          try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtx) {
              const audioCtx = new AudioCtx();
              audioContextRef.current = audioCtx;
              const source = audioCtx.createMediaStreamSource(stream);
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              source.connect(analyser);
              const dataArray = new Uint8Array(analyser.frequencyBinCount);

              const updateVolume = () => {
                if (recorderStatusRef.current === "recording") {
                  analyser.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                  }
                  const avg = sum / dataArray.length;
                  setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
                  animFrameRef.current = requestAnimationFrame(updateVolume);
                } else {
                  setAudioLevel(0);
                }
              };
              updateVolume();
            }
          } catch (e) {
            console.warn("AudioContext visualizer error:", e);
          }

          // Create MediaRecorder instance
          const mediaRecorder = new MediaRecorder(
            stream,
            selectedMimeType ? { mimeType: selectedMimeType } : undefined
          );
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          // STOP HANDLER: Create audio blob URL & cleanup mic tracks
          mediaRecorder.onstop = async () => {
            const actualMime = mediaRecorder.mimeType || selectedMimeType || "audio/webm";
            const audioBlobObj = new Blob(audioChunksRef.current, { type: actualMime });
            const url = URL.createObjectURL(audioBlobObj);
            setAudioUrl(url);
            setAudioBlob(audioBlobObj);

            // Stop mic stream tracks after blob creation
            stream.getTracks().forEach((t) => t.stop());
            setAudioLevel(0);

            setStatusMessage("Transcribing...");
            try {
              const text = await transcribeAudio(audioBlobObj);
              if (text) {
                setVoiceTranscript((prev) => prev ? prev + "\n" + text : text);
                setShowTranscript(true);
                setStatusMessage("✓ Voice transcribed successfully.");
              } else {
                setStatusMessage("✓ Voice recording saved. Play back audio below.");
              }
            } catch (err) {
              console.error(err);
              setStatusMessage("✓ Voice recording saved. Transcription failed.");
            }
          };

          mediaRecorder.start(200);
        })
        .catch((err) => {
          console.error("Microphone permission error or unsupported:", err);
          setStatusMessage("❌ Mic access denied. Please check microphone permissions.");
        });
    } else {
      setStatusMessage("❌ Microphone not supported in this browser.");
    }
  }

  // PAUSE RECORDING
  function pauseRecording() {
    setRecorderStatus("paused");
    setStatusMessage("⏸️ Recording paused.");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause();
    }
  }

  // RESUME RECORDING
  function resumeRecording() {
    setRecorderStatus("recording");
    setStatusMessage("🔴 Recording resumed...");
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume();
    }
  }

  // STOP RECORDING
  function stopRecording() {
    setRecorderStatus("stopped");

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }

  // RE-RECORD AUDIO
  function resetRecording() {
    stopRecording();
    setAudioUrl(null);
    setAudioBlob(null);
    setVoiceTranscript("");
    setRecorderStatus("idle");
    setRecordingSeconds(0);
    setStatusMessage("");
  }

  // Handle File Selections
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);

    const newItems: AttachedFileItem[] = selectedFiles.map((file) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: file.size,
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : "document",
      url: URL.createObjectURL(file),
      fileObj: file,
    }));

    setAttachments((prev) => [...prev, ...newItems]);
    setShowAttachMenu(false);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Open Review Screen Modal
  function handleOpenReview() {
    setReviewVoiceTranscript(voiceTranscript);
    setReviewTextInput(textInput);
    setShowReviewModal(true);
  }

  // Submit Complaint & Proceed to HPC
  async function handleFinalSubmit() {
    setSaving(true);
    try {
      // 1. Upload new Audio Blob if it exists
      let finalAudioUrl = audioUrl;
      if (audioBlob) {
        setStatusMessage("Uploading audio...");
        const res = await fetch('/api/upload?filename=complaint-audio.webm', {
          method: 'POST',
          body: audioBlob,
        });
        const data = await res.json();
        if (data.url) finalAudioUrl = data.url;
      }

      // 2. Upload new Attachments if they have fileObj
      setStatusMessage("Uploading attachments...");
      const uploadedImages = await Promise.all(
        attachments
          .filter((a) => a.type === "image")
          .map(async (a) => {
            if (a.fileObj) {
              const res = await fetch(`/api/upload?filename=${encodeURIComponent(a.name)}`, {
                method: 'POST',
                body: a.fileObj,
              });
              const data = await res.json();
              return data.url || a.url; // fallback to object url on error
            }
            return a.url;
          })
      );

      const uploadedFiles = await Promise.all(
        attachments
          .filter((a) => a.type !== "image")
          .map(async (a) => {
            if (a.fileObj) {
              const res = await fetch(`/api/upload?filename=${encodeURIComponent(a.name)}`, {
                method: 'POST',
                body: a.fileObj,
              });
              const data = await res.json();
              return data.url || a.url;
            }
            return a.url;
          })
      );

      setStatusMessage("Saving complaint...");
      await fetch(`/api/encounters/${encounterId}/complaint`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceTranscript: reviewVoiceTranscript,
          audioUrl: finalAudioUrl || null,
          textInput: reviewTextInput,
          images: uploadedImages,
          files: uploadedFiles,
          gemmaSummary: reviewTextInput || reviewVoiceTranscript || "Complaint recorded",
          complaintSegments: [
            {
              label: "Chief Complaint",
              summary: reviewTextInput || reviewVoiceTranscript || "Primary symptom noted.",
            },
          ],
        }),
      });

      router.push(`/encounter/${encounterId}/hpc`);
    } catch (err) {
      console.error("Failed to save complaint:", err);
      setStatusMessage("❌ Failed to save complaint.");
    } finally {
      setSaving(false);
    }
  }

  const hasAnyContent =
    textInput.trim().length > 0 ||
    voiceTranscript.trim().length > 0 ||
    attachments.length > 0 ||
    Boolean(audioUrl);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <AllergyBanner allergies={allergies} />

      {/* Hidden File & Camera Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* 1. VOICE AUDIO RECORDER CARD */}
      <div
        style={{
          background:
            recorderStatus === "recording"
              ? "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)"
              : recorderStatus === "paused"
              ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
              : "#ffffff",
          borderRadius: "20px",
          border: recorderStatus === "idle" || recorderStatus === "stopped" ? "1.5px solid #e4e4e7" : "none",
          boxShadow:
            recorderStatus === "recording"
              ? "0 10px 30px -5px rgba(15, 118, 110, 0.35)"
              : recorderStatus === "paused"
              ? "0 10px 30px -5px rgba(217, 119, 6, 0.35)"
              : "0 4px 14px rgba(0,0,0,0.03)",
          color: recorderStatus === "recording" || recorderStatus === "paused" ? "#ffffff" : "#18181b",
          padding: "14px 16px",
          transition: "all 0.3s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          
          {/* Dynamic Recorder Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            
            {/* IDLE STATE: Start Button */}
            {recorderStatus === "idle" && (
              <button
                type="button"
                onClick={startRecording}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  padding: "8px 16px",
                  borderRadius: "30px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#991b1b"
                }}
              >
                <span
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#ef4444",
                    display: "inline-block"
                  }}
                />
                <span>Start Recording</span>
              </button>
            )}

            {/* RECORDING STATE: Pulsing Badge + Pause + Stop */}
            {recorderStatus === "recording" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.2)", padding: "6px 14px", borderRadius: "24px" }}>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#ef4444",
                      boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.4)",
                      display: "inline-block"
                    }}
                  />
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                    🔴 Recording ({formatTime(recordingSeconds)})
                  </span>
                </div>

                {/* Mic Audio Level Meter */}
                <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "16px", background: "rgba(0,0,0,0.15)", padding: "0 6px", borderRadius: "8px" }}>
                  <div style={{ width: "4px", height: `${Math.max(4, audioLevel * 0.16)}px`, background: "#4ade80", borderRadius: "2px", transition: "height 0.1s" }} />
                  <div style={{ width: "4px", height: `${Math.max(4, audioLevel * 0.16 * 1.2)}px`, background: "#4ade80", borderRadius: "2px", transition: "height 0.1s" }} />
                  <div style={{ width: "4px", height: `${Math.max(4, audioLevel * 0.16 * 0.8)}px`, background: "#4ade80", borderRadius: "2px", transition: "height 0.1s" }} />
                </div>

                <button
                  type="button"
                  onClick={pauseRecording}
                  title="Pause recording"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.25)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    border: "1px solid rgba(255,255,255,0.3)"
                  }}
                >
                  <span>⏸️</span> Pause
                </button>

                <button
                  type="button"
                  onClick={stopRecording}
                  title="Stop recording"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "#ef4444",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    boxShadow: "0 2px 8px rgba(239, 68, 68, 0.4)"
                  }}
                >
                  <span>⏹️</span> Stop
                </button>
              </>
            )}

            {/* PAUSED STATE: Amber Badge + Resume + Stop */}
            {recorderStatus === "paused" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255, 255, 255, 0.2)", padding: "6px 14px", borderRadius: "24px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }} />
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
                    ⏸️ Paused ({formatTime(recordingSeconds)})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={resumeRecording}
                  title="Resume recording"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "#16a34a",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span>▶️</span> Resume
                </button>

                <button
                  type="button"
                  onClick={stopRecording}
                  title="Stop recording"
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.25)",
                    color: "white",
                    fontWeight: 800,
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span>⏹️</span> Stop
                </button>
              </>
            )}

            {/* STOPPED STATE: Saved Badge + Re-record */}
            {recorderStatus === "stopped" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f0fdf4", padding: "6px 12px", borderRadius: "20px", border: "1px solid #bbf7d0" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#166534" }}>✓ Voice Saved</span>
                </div>

                <button
                  type="button"
                  onClick={resetRecording}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    background: "#f4f4f5",
                    color: "#52525b",
                    fontWeight: 700,
                    fontSize: "11px",
                    cursor: "pointer",
                    border: "1px solid #e4e4e7"
                  }}
                >
                  🔄 Re-record
                </button>
              </>
            )}

          </div>

        </div>

        {/* Status Bar */}
        {statusMessage && (
          <div style={{ marginTop: "6px", fontSize: "11px", opacity: 0.9, fontWeight: 600 }}>
            {statusMessage}
          </div>
        )}

        {/* Interactive Audio Player Bar for Voice Playback */}
        {audioUrl && (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: recorderStatus === "recording" || recorderStatus === "paused" ? "rgba(255,255,255,0.9)" : "#0f766e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔊 RECORDED VOICE PLAYBACK:
            </span>
            <audio
              src={audioUrl}
              controls
              style={{
                width: "100%",
                height: "38px",
                borderRadius: "10px",
                outline: "none"
              }}
            />
            
            {/* Transcript Accordion */}
            {voiceTranscript && (
              <div style={{ marginTop: "8px", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", background: "#f8fafc" }}>
                <button
                  type="button"
                  onClick={() => setShowTranscript(!showTranscript)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#334155"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>📝</span>
                    <span>View Transcript</span>
                  </div>
                  <span>{showTranscript ? "▼" : "▶"}</span>
                </button>
                
                {showTranscript && (
                  <div style={{ padding: "0 14px 14px 14px" }}>
                    <textarea
                      style={{
                        width: "100%",
                        minHeight: "100px",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "#ffffff",
                        fontSize: "14px",
                        lineHeight: 1.5,
                        color: "#1e293b",
                        outline: "none",
                        resize: "vertical"
                      }}
                      value={voiceTranscript}
                      onChange={(e) => setVoiceTranscript(e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. PRIMARY PHARMACIST TYPING CANVAS */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          border: "1.5px solid #e4e4e7",
          padding: "16px",
          boxShadow: "0 8px 24px -4px rgba(0, 0, 0, 0.04)",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#0f766e" }}>
            ✏️ PHARMACIST NOTES & OBSERVATIONS
          </label>
        </div>

        <textarea
          style={{
            width: "100%",
            minHeight: "150px",
            padding: "14px",
            borderRadius: "14px",
            border: "1px solid #e4e4e7",
            background: "#fdfdfd",
            fontSize: "15px",
            lineHeight: 1.6,
            color: "#18181b",
            outline: "none",
            resize: "vertical"
          }}
          placeholder="Type the primary complaints, symptoms, or observations as you consult with the patient..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />

        {/* 3. UNIFIED ATTACHMENT ACTION BAR & POPOVER */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "24px",
                background: "#f4f4f5",
                border: "1px solid #e4e4e7",
                fontSize: "13px",
                fontWeight: 700,
                color: "#3f3f46",
                cursor: "pointer"
              }}
            >
              <span>📎</span>
              <span>Attach File or Photo</span>
            </button>

            {attachments.length > 0 && (
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#0d9488" }}>
                {attachments.length} attachment{attachments.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Attachment Popover Menu */}
          {showAttachMenu && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: "8px",
                background: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e4e4e7",
                boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                zIndex: 40,
                minWidth: "220px"
              }}
            >
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#18181b",
                  textAlign: "left",
                  cursor: "pointer",
                  background: "transparent"
                }}
              >
                <span>📷</span>
                <span>Take Photo / Video</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#18181b",
                  textAlign: "left",
                  cursor: "pointer",
                  background: "transparent"
                }}
              >
                <span>📁</span>
                <span>Browse Files / Documents</span>
              </button>
            </div>
          )}
        </div>

        {/* STACKED ATTACHMENT CARDS */}
        {attachments.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
            {attachments.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
                  <span style={{ fontSize: "18px" }}>
                    {item.type === "image" ? "📷" : item.type === "video" ? "🎥" : "📄"}
                  </span>
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#1e293b",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {item.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{formatFileSize(item.size)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeAttachment(item.id)}
                  style={{
                    fontSize: "14px",
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONTINUE TO REVIEW & HPC BUTTON */}
      <button
        type="button"
        disabled={!hasAnyContent}
        onClick={handleOpenReview}
        style={{
          width: "100%",
          padding: "16px",
          borderRadius: "28px",
          border: "none",
          background: hasAnyContent
            ? "linear-gradient(135deg, #0f766e 0%, #0284c7 100%)"
            : "#e4e4e7",
          color: hasAnyContent ? "#ffffff" : "#a1a1aa",
          fontSize: "15px",
          fontWeight: 800,
          cursor: hasAnyContent ? "pointer" : "not-allowed",
          boxShadow: hasAnyContent ? "0 8px 24px -4px rgba(15, 118, 110, 0.35)" : "none",
          transition: "all 0.2s",
          marginTop: "8px"
        }}
      >
        Review & Continue to HPC →
      </button>

      {/* 4. COMPLAINT REVIEW & CONFIRMATION MODAL */}
      {showReviewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "480px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "24px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.35)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#0f766e", margin: 0 }}>
                📋 Review Complaint Record
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{ fontSize: "18px", color: "#71717a", background: "none", border: "none", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Audio & Transcript Review */}
            {(audioUrl || reviewVoiceTranscript) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#71717a" }}>
                  🎙️ Recorded Patient Audio
                </label>
                {audioUrl && (
                  <audio controls src={audioUrl} style={{ width: "100%", marginBottom: "6px" }} />
                )}
                {reviewVoiceTranscript && (
                  <textarea
                    style={{
                      width: "100%",
                      minHeight: "80px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: "1px solid #e4e4e7",
                      fontSize: "13px",
                      lineHeight: 1.5,
                      color: "#18181b"
                    }}
                    value={reviewVoiceTranscript}
                    onChange={(e) => setReviewVoiceTranscript(e.target.value)}
                  />
                )}
              </div>
            )}

            {/* Pharmacist Typed Notes Review */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#71717a" }}>
                ✏️ Pharmacist Typed Notes
              </label>
              <textarea
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: "1px solid #e4e4e7",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: "#18181b"
                }}
                value={reviewTextInput}
                onChange={(e) => setReviewTextInput(e.target.value)}
              />
            </div>

            {/* Attachments Preview */}
            {attachments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#71717a" }}>
                  📎 Attachments ({attachments.length})
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {attachments.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "6px 12px",
                        background: "#f1f5f9",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#334155"
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmation Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "20px",
                  background: "#f4f4f5",
                  border: "1px solid #e4e4e7",
                  fontWeight: 700,
                  fontSize: "13px",
                  color: "#52525b",
                  cursor: "pointer"
                }}
              >
                Back to Edit
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleFinalSubmit}
                style={{
                  flex: 1.5,
                  padding: "12px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #0f766e 0%, #0284c7 100%)",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "13px",
                  color: "#ffffff",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)"
                }}
              >
                {saving ? "Saving Record..." : "✓ Confirm & Next to HPC →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
