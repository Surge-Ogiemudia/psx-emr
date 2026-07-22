"use client";

import { useEffect, useRef } from "react";
import { signIn, signOut } from "next-auth/react";

const ALLOWED_ORIGINS = [
  "https://pro.psx.ng",
  "http://localhost:5173",
  "http://localhost:5174",
];

export default function SsoPage() {
  const handledRef = useRef(false);

  useEffect(() => {
    // If not in an iframe, redirect to login
    if (window.self === window.top) {
      window.location.href = "/login";
      return;
    }

    function handleMessage(event: MessageEvent) {
      if (!ALLOWED_ORIGINS.includes(event.origin)) return;

      const { type, token } = event.data || {};

      if (type === "sso-login" && token && !handledRef.current) {
        handledRef.current = true;
        signIn("credentials", { mainPsxToken: token, redirect: false })
          .then((result) => {
            window.parent.postMessage(
              { type: "sso-result", service: "emr", success: !result?.error },
              event.origin
            );
          })
          .catch(() => {
            window.parent.postMessage(
              { type: "sso-result", service: "emr", success: false },
              event.origin
            );
          });
      }

      if (type === "sso-logout" && !handledRef.current) {
        handledRef.current = true;
        signOut({ redirect: false })
          .then(() => {
            window.parent.postMessage(
              { type: "sso-result", service: "emr", success: true },
              event.origin
            );
          })
          .catch(() => {
            window.parent.postMessage(
              { type: "sso-result", service: "emr", success: false },
              event.origin
            );
          });
      }
    }

    window.addEventListener("message", handleMessage);

    // Signal to parent that we're ready to receive commands
    window.parent.postMessage({ type: "sso-ready", service: "emr" }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
