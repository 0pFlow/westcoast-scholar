import { del, get, post } from "@/api/http.js";

export function fetchBookingsByUserId(userId) {
  return get(`/bookings?userId=${encodeURIComponent(userId)}`);
}

export function fetchAllBookings() {
  return get("/bookings");
}

export function createBooking({ userId, courseId, customerName, billingAddress, email, mobile }) {
  return post("/bookings", {
    userId,
    courseId,
    customerName,
    billingAddress,
    email,
    mobile,
    createdAt: new Date().toISOString(),
  });
}

export function deleteBooking(bookingId) {
  return del(`/bookings/${encodeURIComponent(bookingId)}`);
}


