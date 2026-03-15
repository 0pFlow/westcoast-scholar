import { fetchCourses } from "@/api/coursesApi.js";
import { fetchBookingsByUserId } from "@/api/bookingsApi.js";

export function fetchCoursesAndBookingsByUser(userId) {
  return Promise.all([fetchCourses(), fetchBookingsByUserId(userId)]);
}

