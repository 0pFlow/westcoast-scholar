import { PAGES } from "@/constants/routes.js"; // refactor: centralize route strings used by auth redirection

const AUTH_STORAGE_KEY = "auth_user";

export function setAuthUser(user) {
  if (!user || typeof user !== "object") return;

  const sessionUser = {
    id: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    loggedInAt: Date.now(),
  };

  sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
}

export function getAuthUser() {
  const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isTeacher(user = getAuthUser()) {
  return user?.role === "teacher";
}

export function redirectForPage(page, user = getAuthUser()) {
  const isPublicPage = page === "index.html" || page === PAGES.LOGIN; // refactor: use shared page constant

  if (!isPublicPage && !user) {
    return PAGES.LOGIN; // refactor: use shared page constant
  }

  // refactor: consolidate role-based redirect rules in a single lookup map
  const pageRedirectByRole = {
    [PAGES.ADMIN]: () => (isTeacher(user) ? null : PAGES.COURSES),
    [PAGES.LOGIN]: () => (user ? (isTeacher(user) ? PAGES.ADMIN : PAGES.COURSES) : null),
  };

  const resolveRedirect = pageRedirectByRole[page];
  return resolveRedirect ? resolveRedirect() : null;
}
