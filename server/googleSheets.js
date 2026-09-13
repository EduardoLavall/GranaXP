import { google } from "googleapis";
import { getServerEnv } from "./env.js";

const SCHEMA = {
  State: ["user_id", "state_json", "updated_at", "version"],
  Transactions: ["id", "user_id", "value", "category", "description", "date", "created_at", "updated_at", "deleted_at"],
  ImportJobs: ["id", "user_id", "filename", "mime_type", "status", "provider", "created_at", "updated_at", "error"],
  ImportCandidates: ["job_id", "candidate_id", "user_id", "date", "description", "value", "category", "confidence", "status", "raw_json"]
};

let sheetsPromise;

async function sheetsClient() {
  if (!sheetsPromise) {
    sheetsPromise = (async () => {
      const env = getServerEnv();
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: env.clientEmail,
          private_key: env.privateKey
        },
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });
      return google.sheets({ version: "v4", auth });
    })();
  }
  return sheetsPromise;
}

function rowRange(sheet, row, width) {
  const lastColumn = String.fromCharCode(64 + width);
  return `${sheet}!A${row}:${lastColumn}${row}`;
}

export async function ensureSpreadsheetSchema() {
  const env = getServerEnv();
  const sheets = await sheetsClient();
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: env.spreadsheetId,
    fields: "sheets.properties.title"
  });

  const existing = new Set((meta.data.sheets || []).map((sheet) => sheet.properties?.title));
  const missing = Object.keys(SCHEMA).filter((title) => !existing.has(title));

  if (missing.length) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: env.spreadsheetId,
      requestBody: {
        requests: missing.map((title) => ({ addSheet: { properties: { title } } }))
      }
    });
  }

  await Promise.all(Object.entries(SCHEMA).map(async ([title, headers]) => {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: env.spreadsheetId,
      range: `${title}!1:1`
    });
    const current = response.data.values?.[0] || [];
    const correct = headers.every((header, index) => current[index] === header);
    if (!correct) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: env.spreadsheetId,
        range: `${title}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] }
      });
    }
  }));
}

export async function readState(userId) {
  const env = getServerEnv();
  const sheets = await sheetsClient();
  await ensureSpreadsheetSchema();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.spreadsheetId,
    range: "State!A2:D"
  });
  const rows = response.data.values || [];
  const row = rows.find((item) => item[0] === userId);
  if (!row?.[1]) return null;
  try {
    return JSON.parse(row[1]);
  } catch {
    throw new Error("Stored state_json is not valid JSON.");
  }
}

async function upsertStateRow(userId, state) {
  const env = getServerEnv();
  const sheets = await sheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.spreadsheetId,
    range: "State!A2:D"
  });
  const rows = response.data.values || [];
  const index = rows.findIndex((item) => item[0] === userId);
  const now = new Date().toISOString();
  const values = [userId, JSON.stringify(state), now, String(state.version || 1)];

  if (index === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.spreadsheetId,
      range: "State!A:D",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [values] }
    });
  } else {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.spreadsheetId,
      range: rowRange("State", index + 2, 4),
      valueInputOption: "RAW",
      requestBody: { values: [values] }
    });
  }
}

async function syncTransactions(userId, transactions = []) {
  const env = getServerEnv();
  const sheets = await sheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: env.spreadsheetId,
    range: "Transactions!A2:I"
  });
  const rows = response.data.values || [];
  const now = new Date().toISOString();
  const currentIds = new Set(transactions.map((item) => String(item.id)));
  const existingById = new Map();

  rows.forEach((row, index) => {
    if (row[1] === userId && row[0]) existingById.set(String(row[0]), { row, sheetRow: index + 2 });
  });

  const appendRows = [];
  const updates = [];

  for (const item of transactions) {
    const id = String(item.id);
    const existing = existingById.get(id);
    const createdAt = item.createdAt || existing?.row?.[6] || now;
    const values = [
      id,
      userId,
      Number(item.value || 0),
      String(item.category || "outros"),
      String(item.description || ""),
      String(item.date || ""),
      createdAt,
      now,
      ""
    ];

    if (!existing) appendRows.push(values);
    else updates.push({ range: rowRange("Transactions", existing.sheetRow, 9), values: [values] });
  }

  for (const [id, existing] of existingById) {
    if (!currentIds.has(id) && !existing.row[8]) {
      const tombstone = [...existing.row];
      while (tombstone.length < 9) tombstone.push("");
      tombstone[7] = now;
      tombstone[8] = now;
      updates.push({ range: rowRange("Transactions", existing.sheetRow, 9), values: [tombstone] });
    }
  }

  if (appendRows.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: env.spreadsheetId,
      range: "Transactions!A:I",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: appendRows }
    });
  }

  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: env.spreadsheetId,
      requestBody: { valueInputOption: "RAW", data: updates }
    });
  }
}

export async function writeState(userId, state) {
  await ensureSpreadsheetSchema();
  await upsertStateRow(userId, state);
  await syncTransactions(userId, Array.isArray(state.transactions) ? state.transactions : []);
  return state;
}

export async function pingSpreadsheet() {
  const env = getServerEnv();
  const sheets = await sheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: env.spreadsheetId,
    fields: "spreadsheetId,properties.title"
  });
  return {
    spreadsheetId: response.data.spreadsheetId,
    title: response.data.properties?.title || null
  };
}
