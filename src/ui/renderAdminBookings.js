import { requireRole } from "@/auth/authGuard.js";
import { fetchAllBookings } from "@/api/bookingsApi.js";
import { createCourse, deleteCourse, fetchCourses } from "@/api/coursesApi.js";
import { fetchUsers } from "@/api/usersApi.js";
import { createCourseCard } from "@/ui/courseCard.js";
import { clearChildren } from "@/ui/dom.js";
import { hideViewState, setViewState } from "@/ui/viewState.js";
import { formatCreatedAt } from "@/utils/date.js";
import { handleApiError } from "@/utils/errorHandler.js"; // refactor: centralize error handling with retry support

function createCourseCardTemplate(course = {}) {
  return `<p><strong>Course number:</strong> ${course?.courseNumber ?? "-"}</p>`;
}

function createBookingRowTemplate(booking = {}) {
  return `
      <p><strong>Email:</strong> ${booking.studentEmail ?? "-"}</p>
      <p><strong>Created:</strong> ${booking.createdAtText ?? "-"}</p>
    `;
}

function createAdminBookingCard({ booking, course, user }) {
  const createdAtText = formatCreatedAt(booking?.createdAt);
  const studentName = user?.name || "Unknown user";
  const studentEmail = user?.email || "-";

  return createCourseCard({
    title: course?.title,
    courseNumber: course?.courseNumber,
    days: course?.days,
    startDate: course?.startDate,
    mode: course?.mode,
    price: course?.price,
    ratingAvg: course?.ratingAvg,
    leadText: `Booked by ${studentName}.`,
    metaTimeText: `Booking #${booking?.id ?? "-"}`,
    extraHtml: createBookingRowTemplate({ studentEmail, createdAtText }),
    extraHidden: false,
    footerIsCentered: true,
    footerHtml: `<span class="course-btn is-booked" aria-disabled="true">Active Booking</span>`,
    dataset: { bookingId: booking?.id },
  });
}

function createAdminCourseCard({ course }) {
  return createCourseCard({
    title: course?.title,
    courseNumber: course?.courseNumber,
    days: course?.days,
    startDate: course?.startDate,
    mode: course?.mode,
    price: course?.price,
    ratingAvg: course?.ratingAvg,
    leadText: "Course",
    metaTimeText: `Course #${course?.id ?? "-"}`,
    extraHtml: createCourseCardTemplate(course),
    extraHidden: false,
    footerIsCentered: true,
    footerHtml: `<button type="button" class="course-btn cancel-btn" data-delete-course-id="${course?.id ?? ""}">Delete Course</button>`,
    dataset: { courseId: course?.id },
  });
}

function attachDeleteCourseListeners({ grid, stateEl, rerender } = {}) {
  if (!grid) return;

  const deleteButtons = grid.querySelectorAll("[data-delete-course-id]");
  deleteButtons.forEach((button) => {
    if (button.dataset.bound) return;
    button.dataset.bound = "true";

    button.addEventListener("click", async () => {
      const courseId = Number(button.dataset.deleteCourseId);
      if (!courseId) return;

      const confirmed = window.confirm("Are you sure you want to delete this course?");
      if (!confirmed) return;

      try {
        await deleteCourse(courseId);
        await rerender?.();
      } catch (error) {
        console.warn("delete course error:", error);
        setViewState(stateEl, "Could not delete course, please try again.");
      }
    });
  });
}

function getCreateCoursePayload(form, selectedModes = new Set()) {
  const formData = new FormData(form);

  return {
    title: String(formData.get("title") || "").trim(),
    courseNumber: String(formData.get("courseNumber") || "").trim(),
    days: Number(formData.get("days")),
    price: Number(formData.get("price")) || 0,
    mode: Array.from(selectedModes),
    startDate: String(formData.get("startDate") || "").trim(),
    teacher: String(formData.get("teacher") || "").trim(),
  };
}

function setCreateCourseMessage(messageEl, message) {
  if (!messageEl) return;
  messageEl.hidden = !message;
  messageEl.textContent = message || "";
}
function attachCreateCourseFormListener({ form, messageEl, onSuccess } = {}) {
  if (!form || form.dataset.bound) return;
  form.dataset.bound = "true";
  const selectedModes = new Set();
  const modeButtons = Array.from(form.querySelectorAll(".role-btn[data-mode]"));

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      if (!mode) return;

      if (selectedModes.has(mode)) {
        selectedModes.delete(mode);
        button.classList.remove("is-primary");
      } else {
        selectedModes.add(mode);
        button.classList.add("is-primary");
      }
      setCreateCourseMessage(messageEl, "");
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (selectedModes.size === 0) {
      setCreateCourseMessage(messageEl, "Select at least one delivery method");
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    const defaultButtonText = submitButton?.textContent || "Create Course";

    setCreateCourseMessage(messageEl, "");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Adding...";
    }

    try {
      await createCourse(getCreateCoursePayload(form, selectedModes));
      form.reset();
      selectedModes.clear();
      modeButtons.forEach((button) => button.classList.remove("is-primary"));
      setCreateCourseMessage(messageEl, "Course added!");
      await onSuccess?.();
    } catch (error) {
      console.warn("create course error:", error);
      setCreateCourseMessage(messageEl, "Something went wrong, please try again.");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = defaultButtonText;
      }
    }
  });
}

function ensureCreateCourseSection({
  gridId = "adminBookingsGrid",
  stateId = "adminBookingsState",
  titleId = "adminBookingsTitle",
} = {}) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  let section = document.getElementById("adminCreateCourseSection");

  if (!section) {
    section = document.createElement("section");
    section.id = "adminCreateCourseSection";
    section.className = "page-card booking-form-card";
    section.innerHTML = `
      <h2 class="courses-title booking-form-title">Add Course</h2>
      <p class="courses-subtitle">Create a new course and update the list instantly.</p>
      <form id="adminCreateCourseForm" class="booking-form">
        <div class="booking-form-grid">
          <label class="booking-field">
            <span>Title</span>
            <input class="booking-input" name="title" type="text" required />
          </label>
          <label class="booking-field">
            <span>Course Number</span>
            <input class="booking-input" name="courseNumber" type="text" required />
          </label>
          <label class="booking-field">
            <span>Days</span>
            <input class="booking-input" name="days" type="number" min="1" required />
          </label>
          <label class="booking-field">
            <span>Cost</span>
            <input class="booking-input" name="price" type="number" min="0" required />
          </label>
          <label class="booking-field">
            <span>Start Date</span>
            <input class="booking-input" name="startDate" type="date" min="2026-01-01" max="2049-12-31" required />
          </label>
          <label class="booking-field">
            <span>Teacher</span>
            <input class="booking-input" name="teacher" type="text" required />
          </label>
          <div class="booking-field">
            <span>Delivery</span>
            <div class="pin-role-select">
              <button type="button" class="course-btn role-btn" data-mode="classroom">Classroom</button>
              <button type="button" class="course-btn role-btn" data-mode="distance">Distance</button>
            </div>
          </div>
        </div>
        <div class="booking-form-actions">
          <button class="course-btn is-admin-submit" type="submit">Create Course</button>
        </div>
      </form>
      <div class="courses-state" id="adminCreateCourseState" hidden></div>
    `;
    grid.parentElement?.insertBefore(section, grid);
  }

  const form = section.querySelector("#adminCreateCourseForm");
  const messageEl = section.querySelector("#adminCreateCourseState");
  attachCreateCourseFormListener({
    form,
    messageEl,
    onSuccess: () => renderAdminBookings({ gridId, stateId, titleId }),
  });
}

async function fetchAdminData() {
  const [bookings, courses, users] = await Promise.all([
    fetchAllBookings(),
    fetchCourses(),
    fetchUsers(),
  ]);

  return {
    bookings: Array.isArray(bookings) ? bookings : [],
    courses: Array.isArray(courses) ? courses : [],
    users: Array.isArray(users) ? users : [],
  };
}

function renderAdminCourseGrid({ coursesGrid, courses, stateEl, rerender } = {}) {
  if (!coursesGrid) return;

  clearChildren(coursesGrid);
  courses.forEach((course) => {
    coursesGrid.appendChild(createAdminCourseCard({ course }));
  });

  attachDeleteCourseListeners({
    grid: coursesGrid,
    stateEl,
    rerender,
  });
}

function renderAdminBookingList({ grid, stateEl, bookings, courseById, userById } = {}) {
  if (!grid) return;

  clearChildren(grid);

  if (bookings.length === 0) {
    setViewState(stateEl, "No bookings found.");
    return;
  }

  bookings.forEach((booking) => {
    const course = courseById.get(Number(booking.courseId)) || {
      title: "Unknown course",
      courseNumber: "-",
    };
    const user = userById.get(Number(booking.userId));
    grid.appendChild(createAdminBookingCard({ booking, course, user }));
  });

  hideViewState(stateEl);
}

export async function renderAdminBookings({
  gridId = "adminBookingsGrid",
  coursesGridId = "adminCoursesGrid",
  stateId = "adminBookingsState",
  titleId = "adminBookingsTitle",
} = {}) {
  ensureCreateCourseSection({ gridId, stateId, titleId });
  const grid = document.getElementById(gridId);
  const coursesGrid = document.getElementById(coursesGridId);
  const stateEl = document.getElementById(stateId);
  const titleEl = document.getElementById(titleId);
  if (!grid || !coursesGrid) return;

  const authUser = requireRole("teacher", { redirectTo: "courses.html" });
  if (!authUser) return;

  if (titleEl) titleEl.textContent = "Admin - All Bookings";
  setViewState(stateEl, "Loading all bookings...");

  try {
    const { bookings, courses, users } = await fetchAdminData();
    const courseById = new Map(courses.map((course) => [Number(course.id), course]));
    const userById = new Map(users.map((user) => [Number(user.id), user]));
    const rerender = () => renderAdminBookings({ gridId, coursesGridId, stateId, titleId });

    renderAdminBookingList({ grid, stateEl, bookings, courseById, userById });
    renderAdminCourseGrid({ coursesGrid, courses, stateEl, rerender });
  } catch (error) {
    // refactor: provide reusable retry-capable error handling instead of static fallback text
    const handledError = handleApiError(error, {
      fallbackMessage: "Could not load admin bookings.",
      retry: true,
      onRetry: () => renderAdminBookings({ gridId, coursesGridId, stateId, titleId }),
    });
    setViewState(stateEl, handledError.userMessage || "Could not load admin bookings.");
  }
}
