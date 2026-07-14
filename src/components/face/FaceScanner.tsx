"use client";

import { useEffect, useRef, useState } from "react";

interface FaceScannerProps {
  onCapture: (data: { embedding: number[]; photo: string }) => void;
  onClose?: () => void;
}

export default function FaceScanner({ onCapture, onClose }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "camera-active" | "detecting" | "captured" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [detectionScore, setDetectionScore] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const faceapiRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        // Safe dynamic import to prevent SSR crashes
        const faceapi = await import("@vladmandic/face-api");
        if (!active) return;
        faceapiRef.current = faceapi;

        // Load model weights from /public/models
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
        await faceapi.nets.faceRecognitionNet.loadFromUri("/models");

        // Start video stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: 640, height: 480 },
          audio: false
        });
        
        if (!active) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setStatus("camera-active");
      } catch (err: any) {
        console.error("FaceScanner init error:", err);
        setStatus("error");
        setErrorMsg(err.message || "Failed to initialize camera or models");
      }
    }

    init();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [facingMode]);

  useEffect(() => {
    if (status !== "camera-active") return;

    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video) return;

    let processing = false;

    async function detect() {
      if (status === "captured" || !video || video.paused || video.ended) return;
      
      if (!processing) {
        processing = true;
        try {
          // Detect face with a lower threshold to track partial alignment/scores
          const detection = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 }))
            .withFaceLandmarks();

          if (detection) {
            setDetectionScore(detection.detection.score);
          } else {
            setDetectionScore(null);
          }
        } catch (err) {
          console.error("Detection error:", err);
        } finally {
          processing = false;
        }
      }
      
      animationRef.current = requestAnimationFrame(detect);
    }

    animationRef.current = requestAnimationFrame(detect);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [status]);

  const handleCapture = async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    if (!faceapi || !video || status !== "camera-active") return;

    setStatus("detecting");
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        alert("No face detected in the frame. Please align face inside the circle and try again.");
        setStatus("camera-active");
        return;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const box = detection.detection.box;
        
        // Pad the box slightly for a better portrait
        const padX = box.width * 0.15;
        const padY = box.height * 0.15;
        const sx = Math.max(0, box.x - padX);
        const sy = Math.max(0, box.y - padY);
        const sWidth = Math.min(video.videoWidth - sx, box.width + padX * 2);
        const sHeight = Math.min(video.videoHeight - sy, box.height + padY * 2);

        canvas.width = 150;
        canvas.height = 150;
        if (ctx) {
          ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, 150, 150);
          const photoBase64 = canvas.toDataURL("image/jpeg", 0.8);
          const embedding = Array.from(detection.descriptor) as number[];
          
          setStatus("captured");
          onCapture({ embedding, photo: photoBase64 });
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
          }
        }
      }
    } catch (err) {
      console.error("Manual capture error:", err);
      alert("Failed to process face. Please try again.");
      setStatus("camera-active");
    }
  };

  return (
    <div style={{
      position: "relative",
      backgroundColor: "#000",
      width: "100%",
      height: "100%",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: (status === "camera-active" || status === "detecting") ? "block" : "none"
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {status === "loading" && (
        <div style={{ color: "#fff", fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div className="ai-dot" style={{ animation: "pulse 1s infinite" }} />
          <span>Loading face detection models...</span>
        </div>
      )}

      {status === "detecting" && (
        <div style={{ color: "#fff", fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", position: "absolute", zIndex: 10 }}>
          <div className="ai-dot" style={{ animation: "pulse 1s infinite" }} />
          <span>Extracting face embedding...</span>
        </div>
      )}

      {status === "error" && (
        <div style={{ color: "#ef4444", fontSize: "11px", padding: "16px", textAlign: "center" }}>
          <strong>Camera Error</strong>
          <p style={{ margin: "4px 0 0 0", color: "#9ca3af" }}>{errorMsg}</p>
        </div>
      )}

      {status === "captured" && (
        <div style={{ color: "#10b981", fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <span>✓ Face Captured</span>
        </div>
      )}

      {(status === "camera-active" || status === "detecting") && (
        <>
          {/* Circular mask overlay to guide the user */}
          <div style={{
            position: "absolute",
            inset: 0,
            border: "40px solid rgba(0,0,0,0.4)",
            borderRadius: "50%",
            pointerEvents: "none",
            boxSizing: "border-box"
          }} />
          <div className="face-scanning" />
          
          <div style={{
            position: "absolute",
            bottom: "76px",
            background: "rgba(0,0,0,0.75)",
            color: "#fff",
            fontSize: "11px",
            padding: "6px 12px",
            borderRadius: "20px",
            pointerEvents: "none"
          }}>
            {detectionScore === null 
              ? "Looking for face..." 
              : `Alignment: ${Math.round(detectionScore * 100)}% (Ready)`}
          </div>

          {status === "camera-active" && (
            <button
              onClick={handleCapture}
              style={{
                position: "absolute",
                bottom: "16px",
                padding: "10px 24px",
                borderRadius: "32px",
                background: "var(--brand)",
                color: "white",
                fontSize: "12px",
                fontWeight: "700",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
              }}
            >
              📷 Capture
            </button>
          )}
        </>
      )}

      {status === "camera-active" && (
        <button 
          type="button"
          onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            zIndex: 100
          }}
        >
          🔄 {facingMode === "user" ? "Back Cam" : "Front Cam"}
        </button>
      )}

      {onClose && (
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: "24px",
            height: "24px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            zIndex: 100
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
