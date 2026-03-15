import { describe, it, expect } from "vitest";
import {
  validateCoursePayload,
  formatCoursePrice,
  isCourseUpcoming,
} from "./courseAdminUtils";

describe("validateCoursePayload", () => {
  const validPayload = {
    title: "JavaScript Fundamentals",
    courseNumber: "JS-101",
    days: 3,
    price: 7900,
    mode: ["classroom"],
    startDate: "2026-06-01",
    teacher: "Larry Fink",
  };

  it("returns valid:true for a complete valid payload", () => {
    const result = validateCoursePayload(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("returns valid:false when title is empty", () => {
    const result = validateCoursePayload({ ...validPayload, title: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("title: required");
  });

  it("returns valid:false when days is 0", () => {
    const result = validateCoursePayload({ ...validPayload, days: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("days: must be greater than 0");
  });

  it("returns valid:false when price is negative", () => {
    const result = validateCoursePayload({ ...validPayload, price: -100 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("price: must be greater than 0");
  });

  it("returns valid:false when mode is empty array", () => {
    const result = validateCoursePayload({ ...validPayload, mode: [] });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("mode: at least one required");
  });

  it("returns valid:false when teacher is missing", () => {
    const result = validateCoursePayload({ ...validPayload, teacher: "" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("teacher: required");
  });

  it("returns valid:false for non-object payload", () => {
    const result = validateCoursePayload(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("payload: invalid");
  });
});

describe("formatCoursePrice", () => {
  it("formats a valid price", () => {
    const expected = new Intl.NumberFormat("sv-SE", {
      style: "currency",
      currency: "SEK",
      maximumFractionDigits: 0,
    }).format(7900);
    expect(formatCoursePrice(7900)).toBe(expected);
  });
  it("returns '-' for null", () => {
    expect(formatCoursePrice(null)).toBe("-");
  });
  it("returns '-' for NaN", () => {
    expect(formatCoursePrice(NaN)).toBe("-");
  });
});

describe("isCourseUpcoming", () => {
  it("returns true for a future date", () => {
    expect(isCourseUpcoming("2099-01-01")).toBe(true);
  });
  it("returns false for a past date", () => {
    expect(isCourseUpcoming("2000-01-01")).toBe(false);
  });
  it("returns false for null", () => {
    expect(isCourseUpcoming(null)).toBe(false);
  });
});
