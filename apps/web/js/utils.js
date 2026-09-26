/**
 * utils.js — DOM helpers, toast notifications, date/status utilities,
 *            basic form validation, and URL param helpers.
 */

/* ── Date formatting ──────────────────────────────────────── */

/**
 * Format an ISO date string to a human-readable Indian locale date.
 * @param {string|null} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ── Status badge class ───────────────────────────────────── */

/**
 * Map a deadline status string to a CSS badge class.
 * @param {string} status
 * @returns {string}
 */
function statusBadgeClass(status) {
  switch (status) {
    case "OPEN":     return "badge--open";
    case "UPCOMING": return "badge--upcoming";
    case "CLOSED":   return "badge--closed";
    default:         return "badge--closed";
  }
}

/* ── Reason cleaning ──────────────────────────────────────── */

/**
 * Strip API prefixes like "Requirement satisfied: " from reason strings.
 * @param {string} reason
 * @returns {string}
 */
function cleanReason(reason) {
  return reason
    .replace(/^Requirement satisfied:\s*/i, "")
    .replace(/^Requirement failed:\s*/i, "")
    .replace(/^Requirement not satisfied:\s*/i, "")
    .trim();
}

/* ── Exam result grouping ─────────────────────────────────── */

/**
 * Group post-level ExamResult[] items into per-exam groups.
 * @param {ExamResult[]} results
 * @returns {GroupedExam[]}
 */
function groupExamResults(results) {
  const groups = new Map();

  for (const result of results) {
    const existing = groups.get(result.exam.id);

    const openCount = result.deadlines.filter(
      (d) => d.status === "OPEN"
    ).length;

    if (!existing) {
      groups.set(result.exam.id, {
        exam: result.exam,
        posts: [result],
        eligible: result.eligible,
        openApplications: openCount,
      });
      continue;
    }

    existing.posts.push(result);
    if (result.eligible) existing.eligible = true;
    existing.openApplications += openCount;
  }

  return Array.from(groups.values());
}

/* ── URL param helpers ────────────────────────────────────── */

/**
 * Get a query-string parameter by name from the current URL.
 * @param {string} name
 * @returns {string|null}
 */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ── DOM helpers ──────────────────────────────────────────── */

/**
 * Shorthand querySelector.
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {Element|null}
 */
function qs(selector, root = document) {
  return root.querySelector(selector);
}

/**
 * Shorthand querySelectorAll (returns array).
 * @param {string} selector
 * @param {ParentNode} [root=document]
 * @returns {Element[]}
 */
function qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/**
 * Show an element by removing the "hidden" utility class.
 * @param {Element|null} el
 */
function show(el) {
  if (el) el.classList.remove("hidden");
}

/**
 * Hide an element by adding the "hidden" utility class.
 * @param {Element|null} el
 */
function hide(el) {
  if (el) el.classList.add("hidden");
}

/**
 * Set text content of an element safely.
 * @param {Element|null} el
 * @param {string} text
 */
function setText(el, text) {
  if (el) el.textContent = text;
}

/**
 * Create an HTML element with optional attributes and inner HTML.
 * @param {string} tag
 * @param {{ [attr: string]: string }} [attrs]
 * @param {string} [innerHTML]
 * @returns {HTMLElement}
 */
function el(tag, attrs = {}, innerHTML = "") {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else node.setAttribute(k, v);
  }
  node.innerHTML = innerHTML;
  return node;
}

/* ── Toast notifications ──────────────────────────────────── */

let _toastTimer = null;

/**
 * Show a temporary toast message at the bottom of the screen.
 * @param {string} message
 * @param {"success"|"error"|"info"} [type="info"]
 */
function showToast(message, type = "info") {
  let toast = qs("#ec-toast");
  if (!toast) {
    toast = el("div", { id: "ec-toast" });
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      maxWidth: "360px",
      padding: "14px 18px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: "700",
      lineHeight: "1.5",
      zIndex: "9999",
      boxShadow: "0 8px 28px rgba(0,0,0,0.14)",
      transform: "translateY(0)",
      transition: "opacity 0.2s ease, transform 0.2s ease",
      fontFamily: "inherit",
    });
    document.body.appendChild(toast);
  }

  const colors = {
    success: { bg: "#e9f8ef", color: "#19713d", border: "#b4dfc4" },
    error:   { bg: "#fdecea", color: "#a33e3e", border: "#f5bfbf" },
    info:    { bg: "#ffffff", color: "#172033", border: "#d8deea" },
  };

  const c = colors[type] || colors.info;
  Object.assign(toast.style, {
    background: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
    opacity: "1",
  });

  toast.textContent = message;

  if (_toastTimer) clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
  }, 3500);
}

/* ── Inline feedback helpers ──────────────────────────────── */

/**
 * Render an error message inside a container element.
 * @param {Element|null} container
 * @param {string} message
 */
function showError(container, message) {
  if (!container) return;
  container.className = "msg msg--error";
  container.textContent = message;
  show(container);
}

/**
 * Render a success message inside a container element.
 * @param {Element|null} container
 * @param {string} message
 */
function showSuccess(container, message) {
  if (!container) return;
  container.className = "msg msg--success";
  container.textContent = message;
  show(container);
}

/**
 * Clear any feedback message inside a container.
 * @param {Element|null} container
 */
function clearMsg(container) {
  if (!container) return;
  container.textContent = "";
  container.className = "msg";
  hide(container);
}

/* ── Simple form validation ───────────────────────────────── */

/**
 * Validate email format.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate that a string is non-empty.
 * @param {string} value
 * @returns {boolean}
 */
function isNonEmpty(value) {
  return value.trim().length > 0;
}
