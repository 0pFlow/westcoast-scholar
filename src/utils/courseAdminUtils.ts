export interface CoursePayload {
  title: string;
  courseNumber: string;
  days: number;
  price: number;
  mode: string[];
  startDate: string;
  teacher: string;
}

export function validateCoursePayload(
  payload: unknown
): { valid: boolean; errors: string[] } {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { valid: false, errors: ["payload: invalid"] };
  }
  const p = payload as Record<string, unknown>;
  const errors: string[] = [];

  if (!p.title || typeof p.title !== "string" || p.title.trim() === "") {
    errors.push("title: required");
  }
  if (!p.courseNumber || typeof p.courseNumber !== "string" || p.courseNumber.trim() === "") {
    errors.push("courseNumber: required");
  }
  if (typeof p.days !== "number" || p.days <= 0) {
    errors.push("days: must be greater than 0");
  }
  if (typeof p.price !== "number" || p.price <= 0) {
    errors.push("price: must be greater than 0");
  }
  if (!Array.isArray(p.mode) || p.mode.length === 0) {
    errors.push("mode: at least one required");
  }
  if (!p.startDate || typeof p.startDate !== "string" || p.startDate.trim() === "") {
    errors.push("startDate: required");
  }
  if (!p.teacher || typeof p.teacher !== "string" || p.teacher.trim() === "") {
    errors.push("teacher: required");
  }

  return { valid: errors.length === 0, errors };
}

export function formatCoursePrice(price: number | null | undefined): string {
  if (typeof price !== "number" || isNaN(price)) return "-";
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(price);
}

export function isCourseUpcoming(startDate: string | null | undefined): boolean {
  if (!startDate) return false;
  try {
    return new Date(startDate) > new Date();
  } catch {
    return false;
  }
}
