import { describe, it, expect } from "vitest";
import {
  formatCourseDate,
  formatCourseModes,
  resolveCourseImage,
  validateBookingPayload,
} from "./courseUtils";

describe("formatCourseDate", () => {
  it("formats a valid ISO date to Swedish medium format", () => {
    const result = formatCourseDate("2026-04-18");
    const expected = new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(
      new Date("2026-04-18"),
    );
    expect(result).toBe(expected);
  });
  it("returns '-' for empty string", () => {
    expect(formatCourseDate("")).toBe("-");
  });
  it("returns '-' for undefined", () => {
    expect(formatCourseDate(undefined)).toBe("-");
  });
  it("returns '-' for invalid date string", () => {
    expect(formatCourseDate("not-a-date")).toBe("-");
  });
});

describe("formatCourseModes", () => {
  it("maps 'classroom' to 'Classroom'", () => {
    expect(formatCourseModes(["classroom"])).toBe("Classroom");
  });
  it("maps ['classroom','distance'] to 'Classroom / Distance'", () => {
    expect(formatCourseModes(["classroom", "distance"])).toBe("Classroom / Distance");
  });
  it("returns '-' for null", () => {
    expect(formatCourseModes(null)).toBe("-");
  });
  it("returns '-' for empty array", () => {
    expect(formatCourseModes([])).toBe("-");
  });
});

describe("resolveCourseImage", () => {
  it("returns course.image if it exists", () => {
    expect(resolveCourseImage({ image: "../assets/custom.avif" })).toBe("../assets/custom.avif");
  });
  it("matches courseNumber JS-101 to correct asset", () => {
    expect(resolveCourseImage({ courseNumber: "JS-101" })).toBe("../assets/react-essentials.avif");
  });
  it("matches title containing 'react' to correct asset", () => {
    expect(resolveCourseImage({ title: "React Advanced" })).toBe("../assets/react-essentials.avif");
  });
  it("returns fallback for null course", () => {
    expect(resolveCourseImage(null)).toBe("../assets/javascript-fund.avif");
  });
  it("returns fallback for course with no image/number/title", () => {
    expect(resolveCourseImage({})).toBe("../assets/javascript-fund.avif");
  });
});

describe("validateBookingPayload", () => {
  it("returns valid:true for complete valid payload", () => {
    const result = validateBookingPayload({
      name: "Anna",
      email: "anna@test.com",
      phone: "0701234567",
      address: "Storgatan 1",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
  it("returns valid:false when name is empty", () => {
    const result = validateBookingPayload({
      name: "",
      email: "anna@test.com",
      phone: "0701234567",
      address: "Storgatan 1",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("name: required");
  });
  it("returns valid:false when email has no @", () => {
    const result = validateBookingPayload({
      name: "Anna",
      email: "annatest.com",
      phone: "0701234567",
      address: "Storgatan 1",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("email: invalid");
  });
  it("returns valid:false when phone is too short", () => {
    const result = validateBookingPayload({
      name: "Anna",
      email: "anna@test.com",
      phone: "123",
      address: "Storgatan 1",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("phone: too short");
  });
  it("returns valid:false for non-object payload", () => {
    const result = validateBookingPayload("not an object");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("payload: invalid");
  });
});
