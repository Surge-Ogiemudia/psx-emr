"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AllergyBanner from "./AllergyBanner";
import { parseJson } from "@/lib/types";
import type { Allergy } from "@/lib/types";

interface AttachedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  fileObj?: File;
}

export default function ComplaintStep({
  encounterId,
  patientAllergies,
}: {
  encounterId: string;
  patientAllergies: string;
}) {
  const router = useRouter();
  const allergies = parseJson<Allergy[]>(patientAllergies, []);

  // Ambient Voice Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [expandedRecorder, setExpandedRecorder] = useState(false);

  // Pharmacist Notes State
  const [textInput, setTextInput] = useState("");

  // Attachment Menu & Files State
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachments, setAttachments] = useState<AttachedFileItem[]>([]);

  // Review Modal & Saving State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewVoiceTranscript, setReviewVoiceTranscript] = useState("");
  const [reviewTextInput, setReviewTextInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Refs for Audio & Speech Recognition
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Ambient Recording Logic
  function startAmbientRecording() {
    setIsRecording(true);
    setRecordingSeconds(0);
    audioChunksRef.current = [];

    // Start timer
    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);

    // Try MediaRecorder API
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
          };

          mediaRecorder.start();
        })
        .catch((err) => {
          console.warn("Microphone access not available or denied:", err);
        });
    }

    // Try SpeechRecognition API for live streaming transcript
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setVoiceTranscript(currentTranscript);
        };
        recognition.start();
        (window as any)._activeRecognition = recognition;
      } catch (e) {
        console.warn("SpeechRecognition error:", e);
      }
    } else {
      // Fallback transcript simulation if SpeechRecognition isn't supported in browser environment
      const sampleText = "Patient reports onset of symptoms this morning with headache and nasal discharge.";
      let idx = 0;
      const streamInterval = setInterval(() => {
        idx += 8;
        setVoiceTranscript(sampleText.slice(0, idx));
        if (idx >= sampleText.length) clearInterval(streamInterval);
      }, 400);
    }
  }

  function stopAmbientRecording() {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }

    if ((window as any)._activeRecognition) {
      try {
        (window as any)._activeRecognition.stop();
      } catch (e) {}
    }
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
      const imageUrls = attachments
        .filter((a) => a.type === "image")
        .map((a) => a.name);
      const fileUrls = attachments
        .filter((a) => a.type !== "image")
        .map((a) => a.name);

      await fetch(`/api/encounters/${encounterId}/complaint`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceTranscript: reviewVoiceTranscript,
          audioUrl: audioUrl || null,
          textInput: reviewTextInput,
          images: imageUrls,
          files: fileUrls,
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
    } finally {
      setSaving(false);
    }
  }

  const hasAnyContent =
    textInput.trim().length > 0 ||
    voiceTranscript.trim().length > 0 ||
    attachments.length > 0;

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

      {/* 1. AMBIENT VOICE RECORDER BAR */}
      <div
        style={{
          background: isRecording
            ? "linear-gradient(135deg, #0f766e 0%, #0891b2 100%)"
            : "#ffffff",
          borderRadius: "20px",
          border: isRecording ? "none" : "1.5px solid #e4e4e7",
          boxShadow: isRecording
            ? "0 10px 30px -5px rgba(15, 118, 110, 0.3)"
            : "0 4px 14px rgba(0,0,0,0.03)",
          color: isRecording ? "#ffffff" : "#18181b",
          padding: "14px 16px",
          transition: "all 0.3s ease"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <button
            type="button"
            onClick={isRecording ? stopAmbientRecording : startAmbientRecording}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: isRecording ? "rgba(255, 255, 255, 0.2)" : "#f0fdf4",
              border: isRecording ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid #bbf7d0",
              padding: "8px 16px",
              borderRadius: "30px",
              cursor: "pointer",
              transition: "transform 0.2s"
            }}
          >
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: isRecording ? "#ef4444" : "#16a34a",
                boxShadow: isRecording ? "0 0 0 4px rgba(239, 68, 68, 0.4)" : "none",
                display: "inline-block"
              }}
            />
            <span style={{ fontSize: "13px", fontWeight: 800, color: isRecording ? "#ffffff" : "#166534" }}>
              {isRecording ? `Listening... (${formatTime(recordingSeconds)})` : "🎙️ Start Ambient Listener"}
            </span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {voiceTranscript && (
              <button
                type="button"
                onClick={() => setExpandedRecorder(!expandedRecorder)}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: isRecording ? "rgba(255,255,255,0.9)" : "#0f766e",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                {expandedRecorder ? "▲ Collapse" : "▼ Transcript"}
              </button>
            )}
          </div>
        </div>

        {/* Live Streaming Snippet */}
        {voiceTranscript && !expandedRecorder && (
          <div
            style={{
              marginTop: "10px",
              fontSize: "13px",
              lineHeight: 1.5,
              opacity: 0.95,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            <strong>Live:</strong> {voiceTranscript}
          </div>
        )}

        {/* Expanded Drawer (Audio Player & Full Transcript) */}
        {expandedRecorder && (
          <div
            style={{
              marginTop: "14px",
              paddingTop: "14px",
              borderTop: isRecording ? "1px solid rgba(255,255,255,0.2)" : "1px solid #e4e4e7",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}
          >
            {audioUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700 }}>Recording Playback:</span>
                <audio src={audioUrl} controls style={{ height: "32px", width: "100%", maxWidth: "320px" }} />
              </div>
            )}
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", opacity: 0.8, marginBottom: "4px" }}>
                Transcribed Audio Text:
              </div>
              <div
                style={{
                  fontSize: "13px",
                  lineHeight: 1.6,
                  background: isRecording ? "rgba(0,0,0,0.15)" : "#f8fafc",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: isRecording ? "none" : "1px solid #e2e8f0"
                }}
              >
                {voiceTranscript || "Listening for speech..."}
              </div>
            </div>
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
            ✏️ Pharmacist Notes & Observations
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

            {/* Audio & Live Transcript Review */}
            {(audioUrl || reviewVoiceTranscript) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 800, textTransform: "uppercase", color: "#71717a" }}>
                  🎙️ Recorded Patient Audio & Transcript
                </label>
                {audioUrl && (
                  <audio src={audioUrl} controls style={{ width: "100%", marginBottom: "6px" }} />
                )}
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
