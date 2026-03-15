import { get } from "@/api/http.js";

export function fetchUsers() {
  return get("/users");
}

export async function loginUser(email, pin) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPin = String(pin || "").trim();

  if (!normalizedEmail || !normalizedPin) {
    return null;
  }

  const path =
    `/users?email=${encodeURIComponent(normalizedEmail)}&pin=${encodeURIComponent(normalizedPin)}`;
  const users = await get(path);
  const user = Array.isArray(users) ? users[0] : null;

  if (!user) return null;

  return {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };
}

