/**
 * index.js — Login page + Dashboard page logic.
 *
 * Renders the login form when no session exists.
 * After successful login (or on page load with an active session),
 * hides the login card and shows the dashboard with eligible exams.
 */

/* ── State ────────────────────────────────────────────────── */
let currentUser = null;
let examResults = [];

/* ── DOM refs ─────────────────────────────────────────────── */
const authPage       = qs("#auth-page");
const dashPage       = qs("#dash-page");
const loginForm      = qs("#login-form");
const loginEmailEl   = qs("#login-email");
const loginPassEl    = qs("#login-password");
const loginErrEl     = qs("#login-error");
const loginBtn       = qs("#login-btn");

const userEmailEl    = qs("#user-email");
const logoutBtn      = qs("#logout-btn");
const profileBtn     = qs("#profile-btn");

const statTotal      = qs("#stat-total");
const statEligible   = qs("#stat-eligible");
const statOpen       = qs("#stat-open");
const statIneligible = qs("#stat-ineligible");

const loadingCard    = qs("#loading-card");
const errorCard      = qs("#error-card");
const errorMsg       = qs("#error-msg");
const retryBtn       = qs("#retry-btn");
const examSection    = qs("#exam-section");
const eligibleCount  = qs("#eligible-count");
const examGrid       = qs("#exam-grid");
const emptyCard      = qs("#empty-card");

/* ── Auth ─────────────────────────────────────────────────── */

async function init() {
  try {
    const data = await authMe();
    currentUser = data.user;
    showDashboard();
    await loadExams();
  } catch (err) {
    if (err.status === 401 || !currentUser) {
      showLogin();
    }
  }
}

function showLogin() {
  show(authPage);
  hide(dashPage);
}

function showDashboard() {
  hide(authPage);
  show(dashPage);
  setText(userEmailEl, currentUser?.email ?? "");
}

/* Login form submit */
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMsg(loginErrEl);
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in…";

  try {
    const email    = loginEmailEl.value;
    const password = loginPassEl.value;

    if (!isValidEmail(email)) {
      showError(loginErrEl, "Please enter a valid email address.");
      return;
    }
    if (!isNonEmpty(password)) {
      showError(loginErrEl, "Please enter your password.");
      return;
    }

    const data = await authLogin(email, password);
    currentUser = data.user;
    showDashboard();
    await loadExams();
  } catch (err) {
    showError(loginErrEl, err.message || "Invalid email or password.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign In";
  }
});

/* Logout */
logoutBtn.addEventListener("click", async () => {
  try { await authLogout(); } catch { /* ignore */ }
  currentUser = null;
  examResults = [];
  renderStats([]);
  examGrid.innerHTML = "";
  hide(examSection);
  hide(emptyCard);
  showLogin();
});

/* Profile navigation */
profileBtn.addEventListener("click", () => {
  window.location.href = "pages/student-profile.html";
});

/* Retry */
retryBtn.addEventListener("click", () => loadExams());

/* ── Load & render exams ──────────────────────────────────── */

async function loadExams() {
  show(loadingCard);
  hide(errorCard);
  hide(examSection);
  hide(emptyCard);

  try {
    const data = await getEligibleExams();
    examResults = data.results ?? [];
    renderDashboard(examResults);
  } catch (err) {
    if (err.status === 401) {
      currentUser = null;
      showLogin();
      return;
    }
    setText(errorMsg, err.message || "Unable to load eligible exams.");
    show(errorCard);
  } finally {
    hide(loadingCard);
  }
}

function renderDashboard(results) {
  const groups = groupExamResults(results);

  const eligible   = groups.filter((g) => g.eligible);
  const ineligible = groups.filter((g) => !g.eligible);
  const openCount  = groups.filter((g) => g.openApplications > 0).length;

  renderStats({ total: groups.length, eligible: eligible.length, open: openCount, ineligible: ineligible.length });

  setText(eligibleCount, `${eligible.length} result${eligible.length !== 1 ? "s" : ""}`);

  if (eligible.length === 0) {
    show(emptyCard);
    hide(examSection);
    examGrid.innerHTML = "";
    return;
  }

  hide(emptyCard);
  show(examSection);
  examGrid.innerHTML = "";
  eligible.forEach((group) => examGrid.appendChild(buildExamCard(group)));
}

function renderStats({ total = 0, eligible = 0, open = 0, ineligible = 0 } = {}) {
  setText(statTotal,      total);
  setText(statEligible,   eligible);
  setText(statOpen,       open);
  setText(statIneligible, ineligible);
}

/* ── Build exam card DOM ──────────────────────────────────── */

function buildExamCard(group) {
  const { exam, posts } = group;

  const eligiblePosts = posts.filter((r) => r.eligible);

  /* Deduplicate deadlines */
  const deadlineMap = new Map();
  eligiblePosts.forEach((r) => {
    r.deadlines.forEach((d) => {
      const key = `${d.id}-${r.post?.name ?? "ExamLevel"}`;
      if (!deadlineMap.has(key)) {
        deadlineMap.set(key, { ...d, postName: r.post?.name ?? "Exam Level" });
      }
    });
  });
  const deadlines = Array.from(deadlineMap.values());

  /* Eligibility reasons (deduplicated) */
  const allReasons = [...new Set(
    eligiblePosts.flatMap((r) => r.reasons)
  )];

  const card = el("article", { class: "exam-card" });

  /* Top row: eligible badge + type */
  const top = el("div", { class: "card-top" });
  top.appendChild(el("span", { class: "badge badge--eligible" }, "✓ Eligible"));
  top.appendChild(el("span", { class: "exam-type-tag" }, exam.examType));
  card.appendChild(top);

  /* Exam name + org */
  card.appendChild(el("h3", {}, exam.name));
  card.appendChild(el("p",  { class: "exam-org" }, exam.conductingBody));

  /* Eligible posts */
  if (eligiblePosts.length > 0) {
    const section = el("div", { class: "card-section" });
    section.appendChild(el("span", { class: "field-label" }, "Eligible Posts"));
    eligiblePosts.forEach((r) => {
      const row = el("div", { class: "post-row" });
      row.appendChild(el("span", {}, "✓"));
      row.appendChild(el("strong", {}, r.post?.name ?? "Exam Level Eligibility"));
      section.appendChild(row);
    });
    card.appendChild(section);
  }

  /* Eligibility reasons */
  if (allReasons.length > 0) {
    const section = el("div", { class: "card-section" });
    section.appendChild(el("span", { class: "field-label" }, "Eligibility"));
    allReasons.forEach((reason) => {
      section.appendChild(
        el("p", { class: "reason-passed" }, `✓ ${cleanReason(reason)}`)
      );
    });
    card.appendChild(section);
  }

  /* Deadlines */
  if (deadlines.length > 0) {
    const section = el("div", { class: "card-section" });
    section.appendChild(el("span", { class: "field-label" }, "Application"));

    deadlines.forEach((d) => {
      const item = el("div", { class: "deadline-item" });

      const meta = el("div", { class: "deadline-meta" });
      meta.appendChild(
        el("span", { class: `badge ${statusBadgeClass(d.status)}` }, d.status)
      );
      meta.appendChild(el("p", { class: "deadline-post" }, d.postName));
      meta.appendChild(
        el("p", {}, `Last Date: <strong>${formatDate(d.applicationEnd)}</strong>`)
      );
      if (d.examDate) {
        meta.appendChild(
          el("p", {}, `Exam Date: <strong>${formatDate(d.examDate)}</strong>`)
        );
      }
      item.appendChild(meta);

      if (d.applicationUrl) {
        const applyLink = el("a", {
          class: "btn btn--primary btn--sm",
          href: d.applicationUrl,
          target: "_blank",
          rel: "noopener noreferrer",
        }, "Apply Officially →");
        item.appendChild(applyLink);
      }

      section.appendChild(item);
    });
    card.appendChild(section);
  }

  /* Official source */
  const firstSource = eligiblePosts[0]?.sources[0];
  if (firstSource) {
    const section = el("div", { class: "card-section source-box" });
    section.appendChild(el("span", { class: "field-label" }, "Official Source"));
    section.appendChild(el("p", {}, firstSource.organization));
    section.appendChild(
      el("a", {
        class: "source-link",
        href: firstSource.officialUrl,
        target: "_blank",
        rel: "noopener noreferrer",
      }, "View official notification")
    );
    card.appendChild(section);
  }

  /* View details button */
  const detailsAction = el("div", { class: "details-action" });
  const detailsBtn = el("button", { class: "btn btn--outline full-width" }, "View Details →");
  detailsBtn.addEventListener("click", () => {
    window.location.href = `pages/exam-detail.html?id=${exam.id}`;
  });
  detailsAction.appendChild(detailsBtn);
  card.appendChild(detailsAction);

  return card;
}

/* ── Boot ─────────────────────────────────────────────────── */
init();
