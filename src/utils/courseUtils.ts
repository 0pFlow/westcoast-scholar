export function formatCourseDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(d);
  } catch {
    return "-";
  }
}

export function formatCourseModes(modes: string[] | null | undefined): string {
  if (!Array.isArray(modes) || modes.length === 0) return "-";
  const map: Record<string, string> = { classroom: "Classroom", distance: "Distance" };
  return modes.map((m) => map[m] ?? m).join(" / ");
}

export function resolveCourseImage(
  course: { courseNumber?: string; title?: string; image?: string } | null | undefined
): string {
  const fallback = "../assets/javascript-fund.avif";
  if (!course) return fallback;
  if (course.image) return course.image;

  const byNumber: Record<string, string> = {
    "JS-101": "../assets/react-essentials.avif",
    "FE-110": "../assets/html-css.avif",
    "RE-201": "../assets/javascript-fund.avif",
    "BE-210": "../assets/nodejs.avif",
  };
  if (course.courseNumber && byNumber[course.courseNumber]) {
    return byNumber[course.courseNumber];
  }

  const title = course.title || "";
  if (/javascript/i.test(title)) return "../assets/javascript-fund.avif";
  if (/html|css/i.test(title)) return "../assets/html-css.avif";
  if (/react/i.test(title)) return "../assets/react-essentials.avif";
  if (/node/i.test(title)) return "../assets/nodejs.avif";

  return fallback;
}

export function validateBookingPayload(
  payload: unknown
): { valid: boolean; errors: string[] } {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { valid: false, errors: ["payload: invalid"] };
  }
  const p = payload as Record<string, unknown>;
  const errors: string[] = [];
  if (!p.name || typeof p.name !== "string" || p.name.trim() === "") {
    errors.push("name: required");
  }
  if (!p.email || typeof p.email !== "string" || !p.email.includes("@") || !p.email.includes(".")) {
    errors.push("email: invalid");
  }
  if (!p.phone || typeof p.phone !== "string" || p.phone.trim().length < 6) {
    errors.push("phone: too short");
  }
  if (!p.address || typeof p.address !== "string" || p.address.trim() === "") {
    errors.push("address: required");
  }
  return { valid: errors.length === 0, errors };
}
