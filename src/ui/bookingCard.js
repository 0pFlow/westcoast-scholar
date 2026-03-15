import { createCourseCard } from "@/ui/courseCard.js";
import { formatCreatedAt } from "@/utils/date.js";
import { withLoading } from "@/ui/bookingHelpers.js";

export function createBookingCard({ booking, course, onCancel } = {}) {
  // refactor: accept a single options object to make call sites safer and self-documenting
  const customerName = booking?.customerName || "-";
  const customerEmail = booking?.email || "-";
  const billingAddress = booking?.billingAddress || "-";
  const mobile = booking?.mobile || "-";
  const createdAt = formatCreatedAt(booking?.createdAt);

  const item = createCourseCard({
    title: course?.title,
    courseNumber: course?.courseNumber,
    days: course?.days,
    startDate: course?.startDate,
    mode: course?.mode,
    price: course?.price,
    ratingAvg: course?.ratingAvg,
    leadText: "Din bokning är registrerad. Hantera den här nedan.",
    metaTimeText: `Bokning #${booking.id}`,
    extraHidden: false,
    extraHtml: `
      <p><strong>Namn:</strong> ${customerName}</p>
      <p><strong>E-post:</strong> ${customerEmail}</p>
      <p><strong>Adress:</strong> ${billingAddress}</p>
      <p><strong>Mobil:</strong> ${mobile}</p>
      <p><strong>Skapad:</strong> ${createdAt}</p>
    `,
    footerIsCentered: true,
    footerHtml: `<button type="button" class="course-btn cancel-btn">Avboka</button>`,
    dataset: { bookingId: booking.id },
  });

  const cancelBtn = item.querySelector(".cancel-btn");
  cancelBtn?.addEventListener("click", async () => {
    await withLoading(
      cancelBtn,
      "Avbokar...",
      () => onCancel(booking, item),
      { resetOnSuccess: false },
    );
  });

  return item;
}
