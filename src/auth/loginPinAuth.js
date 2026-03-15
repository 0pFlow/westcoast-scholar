import { loginUser } from "@/api/usersApi.js";
import { setAuthUser } from "@/auth/authService.js";

export async function submitPinLogin({
  email,
  pin,
  redirectTo = "courses.html",
} = {}) {
  try {
    const user = await loginUser(email, pin);
    if (!user) {
      return { ok: false, reason: "invalid_credentials" };
    }

    setAuthUser(user);
    window.location.href = user.role === "teacher" ? "admin.html" : redirectTo;
    return { ok: true };
  } catch (error) {
    console.warn("Login failed:", error);
    return { ok: false, reason: "request_failed" };
  }
}


