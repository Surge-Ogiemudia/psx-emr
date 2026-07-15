"use client";

import { useEffect, useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SSOHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No SSO token provided.");
      return;
    }

    signIn("credentials", {
      ssoToken: token,
      redirect: false,
    }).then((res) => {
      if (res?.error) {
        setError(`SSO failed: ${res.error}. Token might be invalid, expired, or user not found.`);
      } else {
        window.location.href = "/";
      }
    }).catch((err) => {
      console.error(err);
      setError("Failed to sign in via SSO due to a network error.");
    });
  }, [token]);

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", background: "#fee2e2", color: "#991b1b", padding: "20px", borderRadius: "8px", maxWidth: "400px" }}>
          <h3>SSO Authentication Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", background: "#f3f4f6" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ border: "4px solid #f3f3f3", borderTop: "4px solid #0F6E56", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#374151", fontWeight: 500 }}>Connecting to EMR...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function LoginSsoPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif" }}>
        <p style={{ color: "#374151" }}>Loading secure connection...</p>
      </div>
    }>
      <SSOHandler />
    </Suspense>
  );
}
