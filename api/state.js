import { getServerEnv } from "../server/env.js";
import { readState, writeState } from "../server/googleSheets.js";

const MAX_STATE_BYTES = 250_000;

function parseBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}

function validateState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return "state must be an object";
  if (!state.player || typeof state.player !== "object") return "state.player is required";
  if (!state.budget || typeof state.budget !== "object") return "state.budget is required";
  if (!Array.isArray(state.transactions)) return "state.transactions must be an array";
  const bytes = Buffer.byteLength(JSON.stringify(state), "utf8");
  if (bytes > MAX_STATE_BYTES) return `state exceeds ${MAX_STATE_BYTES} bytes`;
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const { userId } = getServerEnv();

    if (req.method === "GET") {
      const state = await readState(userId);
      return res.status(200).json({ state, source: state ? "google-sheets" : "empty" });
    }

    if (req.method === "PUT") {
      const body = parseBody(req);
      const state = body.state ?? body;
      const validationError = validateState(state);
      if (validationError) return res.status(400).json({ error: "invalid_state", message: validationError });

      const saved = await writeState(userId, state);
      return res.status(200).json({ ok: true, updatedAt: saved.updatedAt || Date.now() });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (error) {
    console.error("state_api_failed", error);
    return res.status(500).json({ error: "state_persistence_failed", message: error.message });
  }
}
