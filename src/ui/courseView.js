export const COURSE_INFO_MISSING_TEXT = "Course information missing.";
export const COURSE_LEAD_TEXT = "";
export const COURSE_TEACHER_LABEL = "Teacher";
export const COURSE_PREVIEW_DESCRIPTION = COURSE_LEAD_TEXT;

// refactor: lift image mapping tables to module-level constants for reuse and clearer lookup logic
const COURSE_IMAGE_MAP = {
  byNumber: {
    "JS-101": "../assets/react-essentials.avif",
    "FE-110": "../assets/html-css.avif",
    "RE-201": "../assets/javascript-fund.avif",
    "BE-210": "../assets/nodejs.avif",
  },
  byTitle: [
    { match: /javascript/i, src: "../assets/javascript-fund.avif" },
    { match: /html|css/i, src: "../assets/html-css.avif" },
    { match: /react/i, src: "../assets/react-essentials.avif" },
    { match: /node/i, src: "../assets/nodejs.avif" },
  ],
  fallback: "../assets/javascript-fund.avif",
};

export const formatCourseDate = (iso) => {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium" }).format(
      new Date(iso),
    );
  } catch {
    return iso;
  }
};

export const formatCourseModes = (modeArr) => {
  if (!Array.isArray(modeArr) || modeArr.length === 0) return "-";
  const map = { classroom: "Classroom", distance: "Distance" };
  return modeArr.map((m) => map[m] || m).join(" / ");
};

export const resolveCourseImage = (course) => {
  const courseNumberImage = COURSE_IMAGE_MAP.byNumber[course?.courseNumber]; // refactor: read image mapping from shared constant table
  if (courseNumberImage) return courseNumberImage;

  const title = String(course?.title || "");
  const titleMatch = COURSE_IMAGE_MAP.byTitle.find((item) => item.match.test(title)); // refactor: read image mapping from shared constant table
  if (titleMatch) return titleMatch.src;

  return COURSE_IMAGE_MAP.fallback; // refactor: read image mapping from shared constant table
};

export const setCourseInfo = (
  courseInfoEl,
  course,
  { missingText = COURSE_INFO_MISSING_TEXT } = {},
) => {
  if (!courseInfoEl) return;
  if (!course) {
    courseInfoEl.textContent = missingText;
    return;
  }
  const courseNumber = course.courseNumber || "-";
  courseInfoEl.textContent = `Du bokar ${course.title || "kurs"} (#${courseNumber}).`;
};

export const setCoursePreview = (
  { course, imageEl, titleEl, metaEl, descEl },
  {
    fallbackImage = "../assets/javascript-fund.avif",
    fallbackTitle = "Course",
    fallbackMeta = "-",
    previewDescription = COURSE_PREVIEW_DESCRIPTION,
  } = {},
) => {
  if (!imageEl || !titleEl || !metaEl || !descEl) return;

  if (!course) {
    imageEl.src = fallbackImage;
    titleEl.textContent = fallbackTitle;
    metaEl.textContent = fallbackMeta;
    descEl.textContent = previewDescription;
    return;
  }

  imageEl.src = resolveCourseImage(course);
  titleEl.textContent = `${course.title || "Course"} (${course.courseNumber || "-"})`;
  metaEl.textContent = `${course.days ?? "-"} days · ${formatCourseModes(course.mode)} · Start ${formatCourseDate(course.startDate)}`;
  descEl.textContent = previewDescription;
};
