import { getServerEnv } from "../server/env.js";
import { pingSpreadsheet } from "../server/googleSheets.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const env = getServerEnv();
    const sheet = await pingSpreadsheet();
    return res.status(200).json({
      ok: true,
      service: "granaxp-api",
      environment: env.environment,
      storage: "google-sheets",
      spreadsheet: { title: sheet.title }
    });
  } catch (error) {
    console.error("health_check_failed", error);
    return res.status(500).json({
      ok: false,
      error: "backend_unavailable",
      message: error.message
    });
  }
}
