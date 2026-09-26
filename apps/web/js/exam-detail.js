/**
 * exam-detail.js — Exam Detail page logic.
 *
 * Reads ?id=<examId> from the URL, fetches all eligible-exams,
 * filters to just the ones matching that exam, then renders:
 *  - Exam header + meta
 *  - Info stat cards
 *  - Description
 *  - Eligible posts with reasons
 *  - Ineligible posts
 *  - Deadlines / application dates
 *  - Official notification sources
 */

/* ── State ────────────────────────────────────────────────── */
let examResults = [];

/* ── DOM refs ─────────────────────────────────────────────── */
const loadingCard = qs("#loading-card");
const errorCard   = qs("#error-card");
const errorMsg    = qs("#error-msg");
const mainContent = qs("#main-content");

/* ── Init ─────────────────────────────────────────────────── */
async function init() {
  const examId = Number(getQueryParam("id"));

  if (!Number.isInteger(examId) || examId <= 0) {
    showErrorState("Invalid exam ID in URL.");
    return;
  }

  // Auth guard
  try {
    await authMe();
  } catch {
    window.location.href = "../index.html";
    return;
  }

  try {
    const data = await getEligibleExams();
    examResults = (data.results ?? []).filter((r) => r.exam.id === examId);

    if (examResults.length === 0) {
      showErrorState("Exam details could not be found.");
      return;
    }

    renderPage();
    hide(loadingCard);
    show(mainContent);
  } catch (err) {
    if (err.status === 401) {
      window.location.href = "../index.html";
      return;
    }
    showErrorState(err.message || "Unable to load exam details.");
  }
}

function showErrorState(message) {
  hide(loadingCard);
  setText(errorMsg, message);
  show(errorCard);
}

/* ── Back buttons (wired after DOM exists) ─────────────────── */
document.querySelectorAll(".back-to-dash").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.location.href = "../index.html";
  });
});

/* ── Render ───────────────────────────────────────────────── */
function renderPage() {
  const exam = examResults[0].exam;

  const eligiblePosts   = examResults.filter((r) => r.post !== null && r.eligible);
  const ineligiblePosts = examResults.filter((r) => r.post !== null && !r.eligible);

  /* Deduplicate deadlines */
  const deadlineMap = new Map();
  examResults.forEach((r) => {
    r.deadlines.forEach((d) => {
      const key = `${d.id}-${r.post?.name ?? "ExamLevel"}`;
      if (!deadlineMap.has(key)) {
        deadlineMap.set(key, { ...d, postName: r.post?.name ?? "Exam Level" });
      }
    });
  });
  const allDeadlines = Array.from(deadlineMap.values());

  /* Deduplicate sources */
  const sourceMap = new Map();
  examResults.flatMap((r) => r.sources).forEach((s) => {
    if (!sourceMap.has(s.id)) sourceMap.set(s.id, s);
  });
  const sources = Array.from(sourceMap.values());

  /* ── Header ────────────────────────────────────────────── */
  setText(qs("#exam-name"),   exam.name);
  setText(qs("#exam-body"),   exam.conductingBody);
  setText(qs("#exam-type-pill"),   exam.examType);
  setText(qs("#exam-eligible-pill"),
    `${eligiblePosts.length} eligible post${eligiblePosts.length !== 1 ? "s" : ""}`
  );

  /* ── Stat info cards ────────────────────────────────────── */
  setText(qs("#info-body"),      exam.conductingBody);
  setText(qs("#info-type"),      exam.examType);
  setText(qs("#info-eligible"),  eligiblePosts.length);
  setText(qs("#info-total"),
    examResults.filter((r) => r.post !== null).length
  );

  /* ── Description ────────────────────────────────────────── */
  if (exam.description) {
    const section = qs("#desc-section");
    setText(qs("#desc-text"), exam.description);
    show(section);
  }

  /* ── Eligible posts ─────────────────────────────────────── */
  const postGrid = qs("#post-grid");
  const postEmpty = qs("#post-empty");

  setText(qs("#eligible-count-badge"), eligiblePosts.length);

  if (eligiblePosts.length === 0) {
    show(postEmpty);
  } else {
    eligiblePosts.forEach((result) => {
      postGrid.appendChild(buildPostCard(result, true));
    });
  }

  /* ── Ineligible posts ───────────────────────────────────── */
  if (ineligiblePosts.length > 0) {
    const ineligSection = qs("#ineligible-section");
    const ineligList    = qs("#ineligible-list");
    setText(qs("#ineligible-count-badge"), ineligiblePosts.length);
    ineligiblePosts.forEach((result) => {
      ineligList.appendChild(buildIneligibleCard(result));
    });
    show(ineligSection);
  }

  /* ── Deadlines ──────────────────────────────────────────── */
  if (allDeadlines.length > 0) {
    const deadlineSection = qs("#deadline-section");
    const deadlineList    = qs("#deadline-list");
    allDeadlines.forEach((d) => deadlineList.appendChild(buildDeadlineCard(d)));
    show(deadlineSection);
  }

  /* ── Sources ────────────────────────────────────────────── */
  if (sources.length > 0) {
    const sourceSection = qs("#source-section");
    const sourceList    = qs("#source-list");
    sources.forEach((s) => sourceList.appendChild(buildSourceCard(s)));
    show(sourceSection);
  }

  /* ── Official website ───────────────────────────────────── */
  if (exam.officialWebsite) {
    const websiteLink = qs("#official-website-link");
    websiteLink.href = exam.officialWebsite;
    show(qs("#official-website-wrap"));
  }
}

/* ── Post card builder ────────────────────────────────────── */
function buildPostCard(result, eligible) {
  const post = result.post;
  const card = el("article", { class: "post-card" });

  // Header row
  const header = el("div", { class: "post-header" });
  const headerLeft = el("div");
  headerLeft.appendChild(
    el("span", { class: "badge badge--eligible" }, "✓ Eligible")
  );
  headerLeft.appendChild(el("h3", {}, post.name));
  header.appendChild(headerLeft);
  if (post.code) header.appendChild(el("span", { class: "post-code" }, post.code));
  card.appendChild(header);

  // Detail grid
  const dg = el("div", { class: "detail-grid" });

  const deptDiv = el("div");
  deptDiv.appendChild(el("span", { class: "field-label" }, "Department"));
  deptDiv.appendChild(el("p", {}, post.department ?? "Not available"));
  dg.appendChild(deptDiv);

  const vacDiv = el("div");
  vacDiv.appendChild(el("span", { class: "field-label" }, "Vacancies"));
  vacDiv.appendChild(el("p", {}, post.vacancies ?? "Not available"));
  dg.appendChild(vacDiv);

  const qualDiv = el("div", { class: "full-width" });
  qualDiv.appendChild(el("span", { class: "field-label" }, "Required Qualification"));
  qualDiv.appendChild(el("p", {}, post.qualification ?? "Not available"));
  dg.appendChild(qualDiv);

  card.appendChild(dg);

  // Post description
  if (post.description) {
    const db = el("div", { class: "desc-box" });
    db.appendChild(el("span", { class: "field-label" }, "Post Description"));
    db.appendChild(el("p", {}, post.description));
    card.appendChild(db);
  }

  // Reasons
  if (result.reasons.length > 0) {
    const rb = el("div", { class: "reasons-box" });
    rb.appendChild(el("span", { class: "field-label" }, "Why you qualify"));
    result.reasons.forEach((r) => {
      rb.appendChild(el("p", { class: "reason-line reason-line--pass" }, `✓ ${cleanReason(r)}`));
    });
    card.appendChild(rb);
  }

  return card;
}

/* ── Ineligible card builder ──────────────────────────────── */
function buildIneligibleCard(result) {
  const post = result.post;
  const card = el("article", { class: "ineligible-card" });

  const left = el("div");
  const header = el("div", { class: "post-header" });
  const hl = el("div");
  hl.appendChild(el("span", { class: "badge badge--ineligible" }, "✕ Not Eligible"));
  hl.appendChild(el("h3", {}, post.name));
  header.appendChild(hl);
  if (post.code) header.appendChild(el("span", { class: "post-code" }, post.code));
  left.appendChild(header);

  if (post.department) left.appendChild(el("p", {}, post.department));
  if (post.vacancies !== null && post.vacancies !== undefined) {
    left.appendChild(el("p", {}, `Vacancies: <strong>${post.vacancies}</strong>`));
  }
  if (post.qualification) {
    const qb = el("div", { class: "desc-box" });
    qb.appendChild(el("span", { class: "field-label" }, "Required Qualification"));
    qb.appendChild(el("p", {}, post.qualification));
    left.appendChild(qb);
  }

  // Reasons
  const rb = el("div", { class: "reasons-box" });
  rb.appendChild(el("span", { class: "field-label" }, "Why you are not eligible"));
  if (result.reasons.length > 0) {
    result.reasons.forEach((r) => {
      rb.appendChild(el("p", { class: "reason-line reason-line--fail" }, `✕ ${cleanReason(r)}`));
    });
  } else {
    rb.appendChild(
      el("p", { class: "reason-line reason-line--fail" },
        "✕ You do not meet the eligibility requirements for this post.")
    );
  }
  left.appendChild(rb);
  card.appendChild(left);

  return card;
}

/* ── Deadline card builder ────────────────────────────────── */
function buildDeadlineCard(d) {
  const card = el("article", { class: "deadline-card" });

  const info = el("div");
  info.appendChild(
    el("span", { class: `badge ${statusBadgeClass(d.status)}` }, d.status)
  );
  info.appendChild(el("h3", {}, d.postName));
  info.appendChild(
    el("p", {}, `Application Start: <strong>${formatDate(d.applicationStart)}</strong>`)
  );
  info.appendChild(
    el("p", {}, `Last Date: <strong>${formatDate(d.applicationEnd)}</strong>`)
  );
  info.appendChild(
    el("p", {}, `Exam Date: <strong>${formatDate(d.examDate)}</strong>`)
  );
  card.appendChild(info);

  if (d.applicationUrl) {
    card.appendChild(
      el("a", {
        class: "btn btn--primary btn--sm",
        href: d.applicationUrl,
        target: "_blank",
        rel: "noopener noreferrer",
      }, "Apply Officially →")
    );
  }

  return card;
}

/* ── Source card builder ──────────────────────────────────── */
function buildSourceCard(s) {
  const card = el("article", { class: "source-card" });

  const info = el("div");
  info.appendChild(el("h3", {}, s.notificationTitle));
  info.appendChild(el("p", {}, s.organization));
  if (s.notificationDate) {
    info.appendChild(
      el("p", {}, `Notification Date: <strong>${formatDate(s.notificationDate)}</strong>`)
    );
  }
  card.appendChild(info);

  card.appendChild(
    el("a", {
      class: "btn btn--outline btn--sm",
      href: s.officialUrl,
      target: "_blank",
      rel: "noopener noreferrer",
    }, "View Official Source →")
  );

  return card;
}

/* ── Boot ─────────────────────────────────────────────────── */
init();
