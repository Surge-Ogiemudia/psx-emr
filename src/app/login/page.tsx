"use client";

import { useState } from "react";
import { loginUser } from "./actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    const result = await loginUser(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "20px",
      background: "var(--surface)"
    }}>
      <div className="card" style={{
        padding: "32px 24px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "700", margin: 0, color: "var(--brand)" }}>Pharmacy EMR</h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", margin: "8px 0 0 0" }}>Sign in to your workspace</p>
        </div>

        <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className="field-label">Phone Number</label>
            <input 
              name="phoneNumber"
              type="text" 
              required
              className="field"
              defaultValue="08000000000"
              placeholder="e.g. 08012345678"
            />
          </div>
          <div>
            <label className="field-label">Password</label>
            <div style={{ position: "relative" }}>
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                className="field"
                defaultValue="password123"
                style={{ paddingRight: "40px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="alert-banner" style={{ marginTop: "8px" }}>
              <div className="alert-text">{error}</div>
            </div>
          )}

          <button 
            type="submit"
            disabled={pending}
            style={{
              marginTop: "16px",
              padding: "14px",
              borderRadius: "32px",
              background: "var(--brand)",
              color: "white",
              border: "none",
              fontWeight: "700",
              fontSize: "14px",
              cursor: pending ? "not-allowed" : "pointer",
              opacity: pending ? 0.7 : 1,
              width: "100%",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            {pending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
