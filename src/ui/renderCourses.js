import { hideViewState, setViewState } from "@/ui/viewState.js";
import { clearChildren } from "@/ui/dom.js";
import { attachCourseDetailsToggle } from "@/ui/renderCourseDetails.js";
import { formatRelativeStartLabel } from "@/utils/date.js";
import { showErrorState } from "@/utils/showErrorState.js";
import { createCourseCard as createBaseCourseCard } from "@/ui/courseCard.js";
import { requireAuthUser } from "@/auth/authGuard.js";
import { fetchCoursesAndBookingsByUser } from "@/utils/apiHelpers.js";
import { COURSE_TEACHER_LABEL } from "@/ui/courseView.js";
import { handleApiError } from "@/utils/errorHandler.js"; // refactor: replace console-only error handling with shared utility

// refactor: extract inline booking-link click listener into a named handler
function handleCourseBookingLinkClick(event) {
  const bookingLink = event.currentTarget;
  sessionStorage.setItem("pending_booking_course_id", bookingLink?.dataset.courseId || "");
}

const createCoursesPageCard = (course, { isBooked = false } = {}) => {
  const teacher = course?.teacher || "-";
  const bookingAction = isBooked
    ? `<span class="course-btn is-primary is-booked" aria-disabled="true">Booked</span>`
    : `<a class="course-btn is-primary" href="booking.html" data-course-id="${course.id}">Book</a>`;

  const el = createBaseCourseCard({
    title: course?.title,
    courseNumber: course?.courseNumber,
    days: course?.days,
    price: course?.price,
    mode: course?.mode,
    startDate: course?.startDate,
    imageSrc: course?.image,
    ratingAvg: course?.ratingAvg,
    leadText: "",
    metaTimeText: formatRelativeStartLabel(course.startDate),
    popular: course?.popular === true,
    extraHidden: true,
    extraHtml: `
      <p class="course-description">${course?.description || ""}</p>
      <p class="course-content"><strong>Content:</strong> ${course?.content || ""}</p>
      <p><strong>${COURSE_TEACHER_LABEL}:</strong> ${teacher}</p>
    `,
    footerHtml: `
      <button type="button" class="course-btn details-btn">Details</button>
      ${bookingAction}
    `,
  });

  const bookingLink = el.querySelector(".course-btn.is-primary[data-course-id]");
  bookingLink?.addEventListener("click", handleCourseBookingLinkClick);

  return el;
};

export async function renderCourses({
  gridId = "coursesGrid",
  stateId = "coursesState",
} = {}) {
  const grid = document.getElementById(gridId);
  const stateEl = document.getElementById(stateId);
  if (!grid) return;

  const authUser = requireAuthUser();
  if (!authUser) return;

  setViewState(stateEl, "Loading courses...");

  try {
    const [courses, bookings] = await fetchCoursesAndBookingsByUser(authUser.id);
    const list = courses || [];
    const bookedCourseIds = new Set((bookings || []).map((item) => Number(item.courseId)));
    clearChildren(grid);

    if (list.length === 0) {
      setViewState(stateEl, "No courses found.");
      return;
    }

    list.forEach((course) => {
      const isBooked = bookedCourseIds.has(Number(course.id));
      const el = createCoursesPageCard(course, { isBooked });
      grid.appendChild(el);
      attachCourseDetailsToggle({ cardElement: el });
    });
    hideViewState(stateEl);
  } catch (err) {
    // refactor: use shared user-visible error handler instead of console.warn only
    const handledError = handleApiError(err, {
      fallbackMessage: "Could not load courses.",
      retry: true,
      onRetry: () => renderCourses({ gridId, stateId }),
    });
    showErrorState(stateEl, handledError.userMessage || "Could not load courses.", {
      retry: true,
      onRetry: () => renderCourses({ gridId, stateId }),
    });
  }
}
