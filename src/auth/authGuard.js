import { getAuthUser } from "@/auth/authService.js";

export function requireAuth({ redirectTo = "login.html" } = {}) {
  const authUser = getAuthUser();
  if (!authUser) {
    window.location.href = redirectTo;
    return null;
  }

  return authUser;
}

export function requireRole(role, { redirectTo = "courses.html" } = {}) {
  const authUser = requireAuth();
  if (!authUser) return null;

  if (authUser.role !== role) {
    window.location.href = redirectTo;
    return null;
  }

  return authUser;
}

export function requireAuthUser({ redirectTo = "login.html" } = {}) {
  return requireAuth({ redirectTo });
}
