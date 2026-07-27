import { prisma } from "@/lib/prisma";

/**
 * Retrieves available Gemini API keys in rotation order.
 * Safe to run server-side only. Keys are never exposed to the client.
 */
export async function getGeminiApiKeys(pharmacyId?: string): Promise<string[]> {
  const keys: string[] = [];

  // 1. Check DB Pharmacy custom API keys
  if (pharmacyId) {
    try {
      const pharmacy = await prisma.pharmacy.findUnique({
        where: { id: pharmacyId },
        select: { aiApiKey: true },
      });
      if (pharmacy?.aiApiKey) {
        // Can be comma-separated list of keys
        const dbKeys = pharmacy.aiApiKey.split(",").map(k => k.trim()).filter(Boolean);
        keys.push(...dbKeys);
      }
    } catch (e) {
      console.error("Error fetching pharmacy API key:", e);
    }
  }

  // 2. Check Environment Variable GEMINI_API_KEYS (comma-separated rotation list)
  if (process.env.GEMINI_API_KEYS) {
    const envKeys = process.env.GEMINI_API_KEYS.split(",").map(k => k.trim()).filter(Boolean);
    keys.push(...envKeys);
  }

  // 3. Fallback to standard GEMINI_API_KEY
  if (process.env.GEMINI_API_KEY) {
    const key = process.env.GEMINI_API_KEY.trim();
    if (key && !keys.includes(key)) {
      keys.push(key);
    }
  }

  return keys;
}

/**
 * Call Gemini API with automatic key failover/rotation.
 * Tries each key in the pool if HTTP 429 / 403 occurs.
 */
export async function callGeminiApiWithRotation(
  prompt: string,
  pharmacyId?: string,
  modelName: string = "gemini-flash-latest"
): Promise<{ text: string; keyUsed: string }> {
  const keys = await getGeminiApiKeys(pharmacyId);

  if (keys.length === 0) {
    throw new Error("NO_API_KEYS");
  }

  let lastError: any = null;

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return { text, keyUsed: apiKey };
      }

      if (response.status === 429 || response.status === 403) {
        console.warn(`Gemini API key #${i + 1} rate limited/unauthorized (status ${response.status}). Trying next key...`);
        lastError = new Error(`RATE_LIMIT_429`);
        continue; // Try next key in pool
      }

      const errText = await response.text();
      console.error(`Gemini API error (Key #${i + 1}):`, errText);
      lastError = new Error(`API_ERROR: ${response.status}`);
    } catch (err) {
      console.error(`Network error with key #${i + 1}:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("ALL_KEYS_EXHAUSTED");
}
