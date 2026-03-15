import {
  formatCourseDate,
  formatCourseModes,
  resolveCourseImage,
} from "@/ui/courseView.js";
import { formatCoursePrice } from "@/utils/courseAdminUtils.ts";

// refactor: extract HTML template generation from createCourseCard orchestration
function buildCourseCardTemplate(course) {
  return `
    <div class="course-media">
      <img class="course-image" src="${course.imageSrc}" alt="${course.title}" loading="lazy" decoding="async" />
    </div>

    <div class="course-body">
      <h3 class="course-title">${course.title} <span class="course-id">#${course.courseNumber}</span></h3>
      <p class="course-lead">${course.leadText}</p>

      <div class="course-meta">
        <span class="meta-pill meta-price">${course.price}</span>
        <span class="meta-pill meta-time">${course.metaTimeText}</span>
      </div>

      <div class="course-inline">
        <span>${course.days} dagar</span>
        <span>${course.modes}</span>
        <span>Start ${course.startDate}</span>
        <span class="course-rating"><span class="star">*</span>${course.rating}</span>
      </div>

      <div class="course-divider"></div>
      ${course.extraBlock}

      <div class="${course.footerClass}">
        ${course.footerHtml}
      </div>
    </div>
  `;
}

export function createCourseCard({
  title = "Untitled course",
  courseNumber = "-",
  days = "-",
  startDate,
  mode,
  price = 0,
  ratingAvg = "-",
  imageSrc,
  leadText,
  metaTimeText,
  footerHtml,
  footerIsCentered = false,
  popular = false,
  extraHtml = "",
  extraHidden = true,
  dataset = {},
} = {}) {
  const formattedStartDate = formatCourseDate(startDate);
  const modes = formatCourseModes(mode);
  const formattedPrice = formatCoursePrice(price);
  const rating = ratingAvg ?? "-";
  const resolvedImageSrc =
    imageSrc || resolveCourseImage({ title, courseNumber, days, startDate, mode, price, ratingAvg });
  const footerClass = footerIsCentered ? "course-card-footer is-center" : "course-card-footer";
  const extraBlock = extraHtml
    ? `<div class="course-extra"${extraHidden ? " hidden" : ""}>${extraHtml}</div>`
    : "";

  const cardElement = document.createElement("article");
  cardElement.className = "course-card";

  Object.entries(dataset).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    cardElement.dataset[key] = String(value);
  });

  cardElement.innerHTML = buildCourseCardTemplate({
    title,
    courseNumber,
    days,
    startDate: formattedStartDate,
    modes,
    price: formattedPrice,
    rating,
    imageSrc: resolvedImageSrc,
    leadText,
    metaTimeText,
    footerHtml,
    footerClass,
    extraBlock,
  });

  if (popular === true) {
    const popularBadge = document.createElement("span");
    popularBadge.className = "course-popular-badge";
    popularBadge.textContent = "⭐ Populär kurs";
    cardElement.prepend(popularBadge);
  }

  return cardElement;
}
