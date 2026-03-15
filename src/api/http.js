import { handleApiError } from "@/utils/errorHandler.js";

// refactor: simplify environment base URL lookup by using optional chaining
const envApiBase = import.meta?.env?.VITE_API_BASE_URL || "";

const API_BASE = (envApiBase || "http://localhost:3001").replace(/\/$/, "");

async function parseResponse(res, method, path) {
  if (!res.ok) {
    const error = new Error(`${method} ${path} failed`);
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function get(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    return await parseResponse(res, "GET", path);
  } catch (error) {
    throw handleApiError(error, { fallbackMessage: `Kunde inte hämta data (${path}).` });
  }
}

export async function post(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    return await parseResponse(res, "POST", path);
  } catch (error) {
    throw handleApiError(error, { fallbackMessage: `Kunde inte skicka data (${path}).` });
  }
}

export async function del(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "DELETE",
    });

    return await parseResponse(res, "DELETE", path);
  } catch (error) {
    throw handleApiError(error, { fallbackMessage: `Kunde inte ta bort data (${path}).` });
  }
}