import { createHmac, timingSafeEqual } from "node:crypto";

// Patient share links (/share/encounter/<id>?scope=...&sig=...) open without a
// login, so they carry an HMAC over the encounter ID and scope. A link can't be
// guessed, and editing the ID or scope invalidates it. Links don't expire.
// SHARE_LINK_SECRET signs them; when it is unset no links can be made or opened.

export const SHARE_SCOPES = ["full", "prescription", "diagnostics", "referral"] as const;
export type ShareScope = (typeof SHARE_SCOPES)[number];

export function isShareScope(value: unknown): value is ShareScope {
  return typeof value === "string" && (SHARE_SCOPES as readonly string[]).includes(value);
}

function computeSignature(secret: string, encounterId: string, scope: ShareScope): string {
  return createHmac("sha256", secret)
    .update(`encounter-share:v1:${encounterId}:${scope}`)
    .digest("base64url");
}

/** Returns the signature for a share link, or null if share links aren't configured. */
export function signShareLink(encounterId: string, scope: ShareScope): string | null {
  const secret = process.env.SHARE_LINK_SECRET;
  if (!secret) return null;
  return computeSignature(secret, encounterId, scope);
}

export function verifyShareLink(encounterId: string, scope: ShareScope, signature: string): boolean {
  const secret = process.env.SHARE_LINK_SECRET;
  if (!secret || !signature) return false;
  const expected = Buffer.from(computeSignature(secret, encounterId, scope));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
