// src/api/coursesApi.js
import { del, get, post } from "@/api/http.js";

export function fetchCourses() {
  return get("/courses");
}

export function createCourse(payload) {
  return post("/courses", payload);
}

export function deleteCourse(id) {
  return del(`/courses/${id}`);
}
