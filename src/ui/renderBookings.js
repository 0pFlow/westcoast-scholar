import { isTeacher } from "@/auth/authService.js";
import {
  createBooking,
  deleteBooking,
  fetchBookingsByUserId,
} from "@/api/bookingsApi.js";
import { fetchCourses } from "@/api/coursesApi.js";
import { hideViewState, setViewState } from "@/ui/viewState.js";
import { clearChildren } from "@/ui/dom.js";
import { requireAuthUser } from "@/auth/authGuard.js";
import {
  COURSE_INFO_MISSING_TEXT,
  COURSE_PREVIEW_DESCRIPTION,
  formatCourseDate,
  formatCourseModes,
  setCourseInfo,
  setCoursePreview,
} from "@/ui/courseView.js";
import { isValidEmail } from "@/utils/validators.js";
import { clearPendingBookingSelection, withLoading } from "@/ui/bookingHelpers.js";
import { BOOKING_TEXT } from "@/constants/text.js";

function toggleBookingForm(formSection, shouldShow) {
  if (!formSection) return;
  formSection.hidden = !shouldShow;
}

function getFormPayload(form) {
  const formData = new FormData(form);
  return {
    customerName: String(formData.get("customerName") || "").trim(),
    billingAddress: String(formData.get("billingAddress") || "").trim(),
    email: String(formData.get("email") || "").trim().toLowerCase(),
    mobile: String(formData.get("mobile") || "").trim(),
  };
}

function ensureMyBookingsSection({ formSection, grid } = {}) {
  if (!grid || !grid.parentElement) return;

  let section = document.getElementById("myBookingsSection");
  if (!section) {
    section = document.createElement("section");
    section.id = "myBookingsSection";
    section.className = "page-card booking-form-card";
    section.innerHTML = `<h2 class="courses-title booking-form-title">My Bookings</h2>`;
  }

  const parent = grid.parentElement;
  const anchor =
    formSection && formSection.parentElement === parent ? formSection.nextSibling : grid;

  if (section.parentElement !== parent) {
    parent.insertBefore(section, anchor || grid);
  }

  if (grid.parentElement !== section) {
    section.appendChild(grid);
  }
}

function createMyBookingHistoryCard({ booking, course, onCancel } = {}) {
  const card = document.createElement("article");
  card.className = "course-card";
  card.dataset.bookingId = String(booking?.id ?? "");
  card.innerHTML = `
    <div class="course-body">
      <h3 class="course-title">${course?.title || "-"}</h3>
      <p class="course-meta">${course?.courseNumber || "-"}</p>
      <div class="course-inline">
        <span>Start: ${formatCourseDate(course?.startDate)}</span>
        <span>${formatCourseModes(course?.mode)}</span>
      </div>
    </div>
    <div class="course-card-footer is-center">
      <button type="button" class="course-btn cancel-btn">Cancel booking</button>
    </div>
  `;

  const cancelButton = card.querySelector(".cancel-btn");
  cancelButton?.addEventListener("click", async () => {
    await onCancel?.(booking, card);
  });

  return card;
}

// refactor: split validation concerns from render flow
function handleBookingValidation({ form, stateEl } = {}) {
  const payload = getFormPayload(form);
  const hasRequired = payload.customerName && payload.billingAddress && payload.email && payload.mobile;
  if (!hasRequired) {
    setViewState(stateEl, BOOKING_TEXT.invalidForm);
    return null;
  }

  if (!isValidEmail(payload.email)) {
    setViewState(stateEl, BOOKING_TEXT.invalidEmail);
    return null;
  }

  return payload;
}

// refactor: split booking form rendering from orchestration logic
function renderBookingForm({
  formSection,
  selectedCourseId,
  hasAlreadyBooked,
  courseInfoEl,
  selectedCourse,
  previewImageEl,
  previewTitleEl,
  previewMetaEl,
  previewDescEl,
} = {}) {
  toggleBookingForm(formSection, Boolean(selectedCourseId) && !hasAlreadyBooked);
  setCourseInfo(courseInfoEl, selectedCourse, { missingText: COURSE_INFO_MISSING_TEXT });
  setCoursePreview(
    {
      course: selectedCourse,
      imageEl: previewImageEl,
      titleEl: previewTitleEl,
      metaEl: previewMetaEl,
      descEl: previewDescEl,
    },
    { previewDescription: COURSE_PREVIEW_DESCRIPTION },
  );
}

// refactor: split booking list rendering from data orchestration
function renderBookingList({ grid, stateEl, courseById, bookingState, handleCancel }, { emptyMessage = BOOKING_TEXT.empty } = {}) {
  clearChildren(grid);

  if (bookingState.currentBookings.length === 0) {
    setViewState(stateEl, emptyMessage);
    return;
  }

  bookingState.currentBookings.forEach((booking) => {
    const course = courseById.get(Number(booking.courseId));
    grid.appendChild(createMyBookingHistoryCard({ booking, course, onCancel: handleCancel }));
  });

  hideViewState(stateEl);
}

// refactor: split booking state decisions into focused helper
function handleBookingState({ selectedCourseId, selectedCourse, hasAlreadyBooked, formSection, stateEl } = {}) {
  if (selectedCourseId && hasAlreadyBooked) {
    clearPendingBookingSelection();
    setViewState(stateEl, BOOKING_TEXT.alreadyBooked);
    return;
  }

  if (selectedCourseId && !selectedCourse) {
    toggleBookingForm(formSection, false);
    setViewState(stateEl, BOOKING_TEXT.courseMissing);
  }
}

// refactor: split event wiring from render logic
function attachBookingEventListeners(config = {}) {
  const {
    cancelBookingBtn,
    form,
    formSection,
    submitBtn,
    selectedCourse,
    courseId,
    hasAlreadyBooked,
    userId,
    userEmail,
    stateEl,
    updateBookings,
  } = config;

  if (cancelBookingBtn && !cancelBookingBtn.dataset.bound) {
    cancelBookingBtn.dataset.bound = "true";
    cancelBookingBtn.addEventListener("click", () => {
      clearPendingBookingSelection();
      if (form) form.reset();
      toggleBookingForm(formSection, false);
      setViewState(stateEl, BOOKING_TEXT.bookingAborted);
    });
  }

  if (!form || !selectedCourse || hasAlreadyBooked || form.dataset.bound) return;
  form.dataset.bound = "true";

  const emailInput = form.querySelector("#bookingCustomerEmail");
  if (emailInput && !emailInput.value) emailInput.value = userEmail || "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = handleBookingValidation({ form, stateEl });
    if (!payload) return;

    await withLoading(submitBtn, "Booking...", async () => {
      await updateBookings({
        payload,
        courseId,
        userId,
        form,
        formSection,
      });
    });
  });
}

async function fetchBookingData({ authUser } = {}) {
  const params = new URLSearchParams(window.location.search);
  const pendingCourseId = sessionStorage.getItem("pending_booking_course_id");
  const selectedCourseId = pendingCourseId || params.get("courseId");

  const [courses, initialBookings] = await Promise.all([
    fetchCourses(),
    fetchBookingsByUserId(authUser.id),
  ]);
  const courseById = new Map((courses || []).map((course) => [Number(course.id), course]));
  const bookingState = { currentBookings: Array.isArray(initialBookings) ? initialBookings : [] };
  const selectedCourse = selectedCourseId ? courseById.get(Number(selectedCourseId)) : null;
  const hasAlreadyBooked = selectedCourseId
    ? bookingState.currentBookings.some((item) => Number(item.courseId) === Number(selectedCourseId))
    : false;

  return {
    bookingState,
    courseById,
    selectedCourse,
    selectedCourseId,
    hasAlreadyBooked,
  };
}

function renderBookingCards({
  formSection,
  courseInfoEl,
  selectedCourse,
  selectedCourseId,
  hasAlreadyBooked,
  previewImageEl,
  previewTitleEl,
  previewMetaEl,
  previewDescEl,
  stateEl,
} = {}) {
  renderBookingForm({
    formSection,
    selectedCourseId,
    hasAlreadyBooked,
    courseInfoEl,
    selectedCourse,
    previewImageEl,
    previewTitleEl,
    previewMetaEl,
    previewDescEl,
  });
  handleBookingState({ selectedCourseId, selectedCourse, hasAlreadyBooked, formSection, stateEl });
}

function renderMyBookingHistory({
  grid,
  stateEl,
  courseById,
  bookingState,
  handleCancel,
  emptyMessage = BOOKING_TEXT.empty,
} = {}) {
  renderBookingList({ grid, stateEl, courseById, bookingState, handleCancel }, { emptyMessage });
}

export async function renderBookings({
  gridId = "bookingsGrid",
  stateId = "bookingsState",
  titleId = "bookingsTitle",
  formSectionId = "bookingFormSection",
  formId = "bookingForm",
  courseInfoId = "bookingCourseInfo",
} = {}) {
  const grid = document.getElementById(gridId);
  const stateEl = document.getElementById(stateId);
  const titleEl = document.getElementById(titleId);
  const formSection = document.getElementById(formSectionId);
  const form = document.getElementById(formId);
  const courseInfoEl = document.getElementById(courseInfoId);
  const cancelBookingBtn = document.getElementById("bookingCancelBtn");
  const previewImageEl = document.getElementById("bookingPreviewImage");
  const previewTitleEl = document.getElementById("bookingPreviewTitle");
  const previewMetaEl = document.getElementById("bookingPreviewMeta");
  const previewDescEl = document.getElementById("bookingPreviewDesc");
  if (!grid) return;

  const authUser = requireAuthUser();
  if (!authUser) return;

  if (isTeacher(authUser)) {
    if (titleEl) titleEl.textContent = "Bookings";
    toggleBookingForm(formSection, false);
    setViewState(stateEl, BOOKING_TEXT.teacherMode);
    return;
  }

  ensureMyBookingsSection({ formSection, grid });

  if (titleEl) titleEl.textContent = "My Bookings";
  setViewState(stateEl, BOOKING_TEXT.loading);

  try {
    const { bookingState, courseById, selectedCourse, selectedCourseId, hasAlreadyBooked } =
      await fetchBookingData({ authUser });

    const handleCancel = async (booking, cardEl) => {
      try {
        await deleteBooking(booking.id);
        bookingState.currentBookings = bookingState.currentBookings.filter(
          (item) => Number(item.id) !== Number(booking.id),
        );
        cardEl?.remove();

        if (bookingState.currentBookings.length > 0) {
          hideViewState(stateEl);
          return true;
        }

        setViewState(stateEl, BOOKING_TEXT.cancelled);
        return true;
      } catch (error) {
        console.warn("cancel booking error:", error);
        setViewState(stateEl, BOOKING_TEXT.cancelNow);
        return false;
      }
    };

    const rerenderList = () =>
      renderMyBookingHistory({
        grid,
        stateEl,
        courseById,
        bookingState,
        handleCancel,
        emptyMessage: "You have no active bookings.",
      });

    const updateBookings = async ({ payload, courseId, userId, form: formEl, formSection: sectionEl }) => {
      try {
        await createBooking({ userId, courseId: Number(courseId), ...payload });
        clearPendingBookingSelection();
        formEl.reset();
        toggleBookingForm(sectionEl, false);
        bookingState.currentBookings = await fetchBookingsByUserId(userId);
        rerenderList();
        setViewState(stateEl, BOOKING_TEXT.bookingDone);
      } catch (error) {
        console.warn("create booking error:", error);
        setViewState(stateEl, BOOKING_TEXT.bookingFail);
      }
    };

    renderBookingCards({
      formSection,
      courseInfoEl,
      selectedCourse,
      selectedCourseId,
      hasAlreadyBooked,
      previewImageEl,
      previewTitleEl,
      previewMetaEl,
      previewDescEl,
      stateEl,
    });
    const submitBtn = form?.querySelector('button[type="submit"]');
    attachBookingEventListeners({
      cancelBookingBtn,
      form,
      formSection,
      submitBtn,
      selectedCourse,
      courseId: selectedCourseId,
      hasAlreadyBooked,
      userId: authUser.id,
      userEmail: authUser.email,
      stateEl,
      updateBookings,
    });
    rerenderList();
  } catch (error) {
    console.warn("renderBookings error:", error);
    setViewState(stateEl, "Could not load bookings.");
  }
}
