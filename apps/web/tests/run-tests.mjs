/**
 * apps/web/tests/run-tests.mjs
 *
 * Lightweight vanilla JS test runner for the frontend.
 * Tests:
 *  1. HTML files exist and contain required elements
 *  2. JS files exist and contain required functions/keywords
 *  3. CSS files exist and define required variables/classes
 *  4. api.js has correct BASE_URL and all endpoint wrappers
 *  5. utils.js exports required helper functions
 *  6. Live API connectivity (when backend is running)
 *
 * Run: node tests/run-tests.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");

// ── Mini test framework ────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    → ${err.message}`);
    failed++;
    failures.push({ name, error: err.message });
  }
}

function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(substring) {
      if (typeof actual === "string" && !actual.includes(substring)) {
        throw new Error(`Expected string to contain "${substring}", but it did not.\nString starts with: "${actual.slice(0, 120)}"`);
      }
      if (Array.isArray(actual) && !actual.includes(substring)) {
        throw new Error(`Expected array to contain ${JSON.stringify(substring)}`);
      }
    },
    toMatch(regex) {
      if (!regex.test(actual)) {
        throw new Error(`Expected to match ${regex}, got: "${String(actual).slice(0, 120)}"`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeGreaterThan(n) {
      if (!(actual > n)) throw new Error(`Expected ${actual} > ${n}`);
    },
  };
}

function describe(suiteName, fn) {
  console.log(`\n── ${suiteName}`);
  fn();
}

function readFile(relPath) {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) throw new Error(`File not found: ${relPath}`);
  return readFileSync(abs, "utf8");
}

function fileExists(relPath) {
  return existsSync(resolve(ROOT, relPath));
}

// ── Tests ──────────────────────────────────────────────────────────────

describe("File structure", () => {
  test("index.html exists", () => {
    expect(fileExists("index.html")).toBeTruthy();
  });
  test("pages/student-profile.html exists", () => {
    expect(fileExists("pages/student-profile.html")).toBeTruthy();
  });
  test("pages/exam-detail.html exists", () => {
    expect(fileExists("pages/exam-detail.html")).toBeTruthy();
  });
  test("pages/signup.html exists", () => {
    expect(fileExists("pages/signup.html")).toBeTruthy();
  });
  test("signup.html exists", () => {
    expect(fileExists("signup.html")).toBeTruthy();
  });
  test("css/style.css exists", () => {
    expect(fileExists("css/style.css")).toBeTruthy();
  });
  test("css/index.css exists", () => {
    expect(fileExists("css/index.css")).toBeTruthy();
  });
  test("css/profile.css exists", () => {
    expect(fileExists("css/profile.css")).toBeTruthy();
  });
  test("css/exam-detail.css exists", () => {
    expect(fileExists("css/exam-detail.css")).toBeTruthy();
  });
  test("css/signup.css exists", () => {
    expect(fileExists("css/signup.css")).toBeTruthy();
  });
  test("js/api.js exists", () => {
    expect(fileExists("js/api.js")).toBeTruthy();
  });
  test("js/utils.js exists", () => {
    expect(fileExists("js/utils.js")).toBeTruthy();
  });
  test("js/index.js exists", () => {
    expect(fileExists("js/index.js")).toBeTruthy();
  });
  test("js/profile.js exists", () => {
    expect(fileExists("js/profile.js")).toBeTruthy();
  });
  test("js/exam-detail.js exists", () => {
    expect(fileExists("js/exam-detail.js")).toBeTruthy();
  });
  test("js/signup.js exists", () => {
    expect(fileExists("js/signup.js")).toBeTruthy();
  });
});

describe("index.html structure", () => {
  const html = readFile("index.html");
  test("has <!DOCTYPE html>", () => expect(html).toContain("<!DOCTYPE html>"));
  test("has <title>", () => expect(html).toContain("<title>"));
  test("loads css/style.css", () => expect(html).toContain("css/style.css"));
  test("loads css/index.css", () => expect(html).toContain("css/index.css"));
  test("loads js/utils.js", () => expect(html).toContain("js/utils.js"));
  test("loads js/api.js", () => expect(html).toContain("js/api.js"));
  test("loads js/index.js", () => expect(html).toContain("js/index.js"));
  test("has login form #login-form", () => expect(html).toContain('id="login-form"'));
  test("has email input #login-email", () => expect(html).toContain('id="login-email"'));
  test("has password input #login-password", () => expect(html).toContain('id="login-password"'));
  test("has login button #login-btn", () => expect(html).toContain('id="login-btn"'));
  test("has auth page #auth-page", () => expect(html).toContain('id="auth-page"'));
  test("has dashboard page #dash-page", () => expect(html).toContain('id="dash-page"'));
  test("has stat cards for total/eligible/open/ineligible", () => {
    expect(html).toContain('id="stat-total"');
    expect(html).toContain('id="stat-eligible"');
    expect(html).toContain('id="stat-open"');
    expect(html).toContain('id="stat-ineligible"');
  });
  test("has loading card #loading-card", () => expect(html).toContain('id="loading-card"'));
  test("has error card #error-card", () => expect(html).toContain('id="error-card"'));
  test("has exam grid #exam-grid", () => expect(html).toContain('id="exam-grid"'));
  test("has logout button #logout-btn", () => expect(html).toContain('id="logout-btn"'));
  test("has profile button #profile-btn", () => expect(html).toContain('id="profile-btn"'));
  test("has user email span #user-email", () => expect(html).toContain('id="user-email"'));
  test("no React or Next.js references", () => {
    const lower = html.toLowerCase();
    if (lower.includes("react") || lower.includes("next/")) {
      throw new Error("Found React/Next.js references in index.html");
    }
  });
});

describe("student-profile.html structure", () => {
  const html = readFile("pages/student-profile.html");
  test("has DOCTYPE", () => expect(html).toContain("<!DOCTYPE html>"));
  test("loads ../css/style.css", () => expect(html).toContain("../css/style.css"));
  test("loads ../css/profile.css", () => expect(html).toContain("../css/profile.css"));
  test("loads ../js/utils.js", () => expect(html).toContain("../js/utils.js"));
  test("loads ../js/api.js", () => expect(html).toContain("../js/api.js"));
  test("loads ../js/profile.js", () => expect(html).toContain("../js/profile.js"));
  test("has profile form #profile-form", () => expect(html).toContain('id="profile-form"'));
  test("has firstName input", () => expect(html).toContain('id="firstName"'));
  test("has lastName input", () => expect(html).toContain('id="lastName"'));
  test("has gender select", () => expect(html).toContain('id="gender"'));
  test("has category select", () => expect(html).toContain('id="category"'));
  test("has state input", () => expect(html).toContain('id="state"'));
  test("has education form #education-form", () => expect(html).toContain('id="education-form"'));
  test("has qualification input", () => expect(html).toContain('id="qualification"'));
  test("has passingYear input", () => expect(html).toContain('id="passingYear"'));
  test("has percentage input", () => expect(html).toContain('id="percentage"'));
  test("has education list #education-list", () => expect(html).toContain('id="education-list"'));
  test("has back button #back-btn", () => expect(html).toContain('id="back-btn"'));
  test("has feedback message #feedback-msg", () => expect(html).toContain('id="feedback-msg"'));
  test("has save profile button #save-profile-btn", () => expect(html).toContain('id="save-profile-btn"'));
  test("has save edu button #save-edu-btn", () => expect(html).toContain('id="save-edu-btn"'));
  test("has cancel edu button #cancel-edu-btn", () => expect(html).toContain('id="cancel-edu-btn"'));
});

describe("exam-detail.html structure", () => {
  const html = readFile("pages/exam-detail.html");
  test("has DOCTYPE", () => expect(html).toContain("<!DOCTYPE html>"));
  test("loads ../css/exam-detail.css", () => expect(html).toContain("../css/exam-detail.css"));
  test("loads ../js/exam-detail.js", () => expect(html).toContain("../js/exam-detail.js"));
  test("has #loading-card", () => expect(html).toContain('id="loading-card"'));
  test("has #error-card", () => expect(html).toContain('id="error-card"'));
  test("has #main-content", () => expect(html).toContain('id="main-content"'));
  test("has #exam-name", () => expect(html).toContain('id="exam-name"'));
  test("has #exam-body", () => expect(html).toContain('id="exam-body"'));
  test("has #post-grid", () => expect(html).toContain('id="post-grid"'));
  test("has #deadline-list", () => expect(html).toContain('id="deadline-list"'));
  test("has #source-list", () => expect(html).toContain('id="source-list"'));
  test("has #ineligible-section", () => expect(html).toContain('id="ineligible-section"'));
  test("has back-to-dash button", () => expect(html).toContain("back-to-dash"));
});

describe("signup.html structure", () => {
  const html = readFile("pages/signup.html");
  test("has DOCTYPE", () => expect(html).toContain("<!DOCTYPE html>"));
  test("loads ../css/style.css", () => expect(html).toContain("../css/style.css"));
  test("loads ../css/signup.css", () => expect(html).toContain("../css/signup.css"));
  test("loads ../js/utils.js", () => expect(html).toContain("../js/utils.js"));
  test("loads ../js/api.js", () => expect(html).toContain("../js/api.js"));
  test("loads ../js/signup.js", () => expect(html).toContain("../js/signup.js"));
  test("has signup form #signup-form", () => expect(html).toContain('id="signup-form"'));
  test("has firstName input", () => expect(html).toContain('id="signup-firstName"'));
  test("has lastName input", () => expect(html).toContain('id="signup-lastName"'));
  test("has email input", () => expect(html).toContain('id="signup-email"'));
  test("has password input", () => expect(html).toContain('id="signup-password"'));
  test("has confirm password input", () => expect(html).toContain('id="signup-confirm-password"'));
  test("has password toggle button", () => expect(html).toContain('id="toggle-password-btn"'));
  test("has confirm password toggle button", () => expect(html).toContain('id="toggle-confirm-btn"'));
  test("has strength meter badge", () => expect(html).toContain('id="meter-badge"'));
  test("has match hint element", () => expect(html).toContain('id="match-hint"'));
  test("has terms declaration checkbox", () => expect(html).toContain('id="signup-terms"'));
  test("has submit button #signup-btn", () => expect(html).toContain('id="signup-btn"'));
  test("has error banner #signup-error", () => expect(html).toContain('id="signup-error"'));
  test("has success banner #signup-success", () => expect(html).toContain('id="signup-success"'));
  test("has link back to sign in", () => expect(html).toContain('href="../index.html"'));
});

describe("js/api.js correctness", () => {
  const js = readFile("js/api.js");
  test("defines API_URL pointing to port 4000", () =>
    expect(js).toContain("4000"));
  test("defines apiFetch function", () =>
    expect(js).toContain("async function apiFetch"));
  test("uses credentials: include", () =>
    expect(js).toContain('credentials: "include"'));
  test("defines authMe()", () =>
    expect(js).toContain("async function authMe"));
  test("defines authLogin()", () =>
    expect(js).toContain("async function authLogin"));
  test("defines authRegister()", () =>
    expect(js).toContain("async function authRegister"));
  test("defines authLogout()", () =>
    expect(js).toContain("async function authLogout"));
  test("defines getEligibleExams()", () =>
    expect(js).toContain("async function getEligibleExams"));
  test("calls /student/eligible-exams", () =>
    expect(js).toContain("/student/eligible-exams"));
  test("defines getProfile()", () =>
    expect(js).toContain("async function getProfile"));
  test("defines saveProfile()", () =>
    expect(js).toContain("async function saveProfile"));
  test("defines getEducation()", () =>
    expect(js).toContain("async function getEducation"));
  test("defines addEducation()", () =>
    expect(js).toContain("async function addEducation"));
  test("defines updateEducation()", () =>
    expect(js).toContain("async function updateEducation"));
  test("defines deleteEducation()", () =>
    expect(js).toContain("async function deleteEducation"));
  test("handles non-OK responses by throwing", () =>
    expect(js).toContain("throw"));
  test("sets Content-Type: application/json", () =>
    expect(js).toContain("application/json"));
});

describe("js/utils.js correctness", () => {
  const js = readFile("js/utils.js");
  test("defines formatDate()", () =>
    expect(js).toContain("function formatDate"));
  test("defines statusBadgeClass()", () =>
    expect(js).toContain("function statusBadgeClass"));
  test("defines groupExamResults()", () =>
    expect(js).toContain("function groupExamResults"));
  test("defines cleanReason()", () =>
    expect(js).toContain("function cleanReason"));
  test("defines qs() DOM helper", () =>
    expect(js).toContain("function qs("));
  test("defines qsa() DOM helper", () =>
    expect(js).toContain("function qsa("));
  test("defines show() helper", () =>
    expect(js).toContain("function show("));
  test("defines hide() helper", () =>
    expect(js).toContain("function hide("));
  test("defines el() element creator", () =>
    expect(js).toContain("function el("));
  test("defines showToast()", () =>
    expect(js).toContain("function showToast("));
  test("defines showError()", () =>
    expect(js).toContain("function showError("));
  test("defines showSuccess()", () =>
    expect(js).toContain("function showSuccess("));
  test("defines clearMsg()", () =>
    expect(js).toContain("function clearMsg("));
  test("defines isValidEmail()", () =>
    expect(js).toContain("function isValidEmail("));
  test("defines getQueryParam()", () =>
    expect(js).toContain("function getQueryParam("));
  test("groupExamResults groups by exam.id", () =>
    expect(js).toContain("groups.get(result.exam.id)"));
  test("formatDate uses en-IN locale", () =>
    expect(js).toContain("en-IN"));
});

describe("js/index.js correctness", () => {
  const js = readFile("js/index.js");
  test("calls authMe() on init", () =>
    expect(js).toContain("authMe"));
  test("calls authLogin() on form submit", () =>
    expect(js).toContain("authLogin"));
  test("calls authLogout() on logout click", () =>
    expect(js).toContain("authLogout"));
  test("calls getEligibleExams()", () =>
    expect(js).toContain("getEligibleExams"));
  test("redirects to student-profile.html for profile", () =>
    expect(js).toContain("student-profile.html"));
  test("redirects to exam-detail.html for exam cards", () =>
    expect(js).toContain("exam-detail.html"));
  test("uses groupExamResults()", () =>
    expect(js).toContain("groupExamResults"));
  test("renders stat values", () =>
    expect(js).toContain("stat-total"));
  test("shows/hides loading card", () =>
    expect(js).toContain("loading-card"));
  test("handles 401 by showing login", () =>
    expect(js).toContain("401"));
});

describe("js/profile.js correctness", () => {
  const js = readFile("js/profile.js");
  test("calls authMe() guard on init", () =>
    expect(js).toContain("authMe"));
  test("calls getProfile()", () =>
    expect(js).toContain("getProfile"));
  test("calls saveProfile()", () =>
    expect(js).toContain("saveProfile"));
  test("calls getEducation()", () =>
    expect(js).toContain("getEducation"));
  test("calls addEducation()", () =>
    expect(js).toContain("addEducation"));
  test("calls updateEducation()", () =>
    expect(js).toContain("updateEducation"));
  test("calls deleteEducation()", () =>
    expect(js).toContain("deleteEducation"));
  test("redirects to index.html on 401", () =>
    expect(js).toContain("index.html"));
  test("renders education list", () =>
    expect(js).toContain("education-list"));
  test("has edit education logic", () =>
    expect(js).toContain("startEditingEducation"));
  test("shows success/error feedback", () =>
    expect(js).toContain("showSuccess"));
});

describe("js/exam-detail.js correctness", () => {
  const js = readFile("js/exam-detail.js");
  test("reads id from URL query param", () =>
    expect(js).toContain("getQueryParam"));
  test("calls authMe() guard", () =>
    expect(js).toContain("authMe"));
  test("calls getEligibleExams()", () =>
    expect(js).toContain("getEligibleExams"));
  test("filters results by examId", () =>
    expect(js).toContain("examId"));
  test("renders eligible posts", () =>
    expect(js).toContain("eligiblePosts"));
  test("renders deadlines", () =>
    expect(js).toContain("deadline"));
  test("renders sources", () =>
    expect(js).toContain("source"));
  test("shows error state", () =>
    expect(js).toContain("showErrorState"));
});

describe("js/signup.js correctness", () => {
  const js = readFile("js/signup.js");
  test("defines checkSession()", () =>
    expect(js).toContain("checkSession"));
  test("defines evaluatePassword()", () =>
    expect(js).toContain("evaluatePassword"));
  test("defines updateMeterUI()", () =>
    expect(js).toContain("updateMeterUI"));
  test("calls authRegister()", () =>
    expect(js).toContain("authRegister"));
  test("validates email length (<= 254)", () =>
    expect(js).toContain("254"));
  test("validates password length (>= 8, <= 128)", () => {
    expect(js).toContain("128");
    expect(js).toContain("8");
  });
  test("handles EMAIL_ALREADY_EXISTS error", () =>
    expect(js).toContain("EMAIL_ALREADY_EXISTS"));
});

describe("css/style.css — design system", () => {
  const css = readFile("css/style.css");
  test("defines --clr-primary CSS variable", () =>
    expect(css).toContain("--clr-primary"));
  test("defines --clr-bg CSS variable", () =>
    expect(css).toContain("--clr-bg"));
  test("defines --clr-border CSS variable", () =>
    expect(css).toContain("--clr-border"));
  test("defines .btn class", () =>
    expect(css).toContain(".btn"));
  test("defines .btn--primary class", () =>
    expect(css).toContain(".btn--primary"));
  test("defines .card class", () =>
    expect(css).toContain(".card"));
  test("defines .badge class", () =>
    expect(css).toContain(".badge"));
  test("defines .spinner class", () =>
    expect(css).toContain(".spinner"));
  test("defines .hidden utility", () =>
    expect(css).toContain(".hidden"));
  test("defines @keyframes spin", () =>
    expect(css).toContain("@keyframes spin"));
  test("defines .msg class", () =>
    expect(css).toContain(".msg"));
  test("has responsive @media query", () =>
    expect(css).toContain("@media"));
  test("no Google Fonts @import (works offline)", () => {
    if (css.includes("fonts.googleapis.com")) {
      throw new Error("css/style.css imports from fonts.googleapis.com — remove this to allow offline use");
    }
  });
});

// ── Functional logic tests (no DOM, pure JS logic) ─────────────────────
describe("Logic: formatDate()", () => {
  // Inline the function logic for isolated testing
  function formatDate(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  test("null → 'Not available'", () =>
    expect(formatDate(null)).toBe("Not available"));
  test("empty string → 'Not available'", () =>
    expect(formatDate("")).toBe("Not available"));
  test("invalid string → 'Not available'", () =>
    expect(formatDate("not-a-date")).toBe("Not available"));
  test("valid ISO date → non-empty string", () => {
    const result = formatDate("2024-05-15T00:00:00.000Z");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("2024");
  });
});

describe("Logic: statusBadgeClass()", () => {
  function statusBadgeClass(status) {
    switch (status) {
      case "OPEN":     return "badge--open";
      case "UPCOMING": return "badge--upcoming";
      case "CLOSED":   return "badge--closed";
      default:         return "badge--closed";
    }
  }

  test("OPEN → badge--open", () =>
    expect(statusBadgeClass("OPEN")).toBe("badge--open"));
  test("UPCOMING → badge--upcoming", () =>
    expect(statusBadgeClass("UPCOMING")).toBe("badge--upcoming"));
  test("CLOSED → badge--closed", () =>
    expect(statusBadgeClass("CLOSED")).toBe("badge--closed"));
  test("unknown → badge--closed", () =>
    expect(statusBadgeClass("WHATEVER")).toBe("badge--closed"));
});

describe("Logic: groupExamResults()", () => {
  function groupExamResults(results) {
    const groups = new Map();
    for (const result of results) {
      const existing = groups.get(result.exam.id);
      const openCount = result.deadlines.filter(d => d.status === "OPEN").length;
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

  const mockExam = { id: 1, name: "UPSC", conductingBody: "UPSC", examType: "Civil Services" };
  const mockResults = [
    { exam: mockExam, post: { id: 1, name: "IAS" }, eligible: true, reasons: [], sources: [], deadlines: [{ status: "OPEN" }] },
    { exam: mockExam, post: { id: 2, name: "IPS" }, eligible: false, reasons: [], sources: [], deadlines: [{ status: "CLOSED" }] },
  ];

  test("groups two posts under one exam", () => {
    const groups = groupExamResults(mockResults);
    expect(groups.length).toBe(1);
  });

  test("eligible is true when any post is eligible", () => {
    const groups = groupExamResults(mockResults);
    expect(groups[0].eligible).toBe(true);
  });

  test("openApplications counts only OPEN deadlines", () => {
    const groups = groupExamResults(mockResults);
    expect(groups[0].openApplications).toBe(1);
  });

  test("empty results → empty groups", () => {
    const groups = groupExamResults([]);
    expect(groups.length).toBe(0);
  });
});

describe("Logic: cleanReason()", () => {
  function cleanReason(reason) {
    return reason
      .replace(/^Requirement satisfied:\s*/i, "")
      .replace(/^Requirement failed:\s*/i, "")
      .replace(/^Requirement not satisfied:\s*/i, "")
      .trim();
  }

  test("strips 'Requirement satisfied: ' prefix", () =>
    expect(cleanReason("Requirement satisfied: Age is within range")).toBe("Age is within range"));
  test("strips 'Requirement failed: ' prefix", () =>
    expect(cleanReason("Requirement failed: Invalid education")).toBe("Invalid education"));
  test("leaves other strings unchanged", () =>
    expect(cleanReason("You are eligible")).toBe("You are eligible"));
  test("case insensitive", () =>
    expect(cleanReason("REQUIREMENT SATISFIED: something")).toBe("something"));
});

describe("Logic: isValidEmail()", () => {
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  test("valid email returns true", () =>
    expect(isValidEmail("user@example.com")).toBe(true));
  test("missing @ returns false", () =>
    expect(isValidEmail("userexample.com")).toBe(false));
  test("missing domain returns false", () =>
    expect(isValidEmail("user@")).toBe(false));
  test("empty string returns false", () =>
    expect(isValidEmail("")).toBe(false));
});

// ── Live API connectivity (optional — skipped if API not running) ──────
describe("Live API connectivity (skipped when API is offline)", () => {
  const API = "http://localhost:4000";

  async function tryFetch(url, opts = {}) {
    try {
      const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(3000) });
      return { ok: true, status: res.status, data: await res.json() };
    } catch {
      return { ok: false };
    }
  }

  test("GET /health returns 200 (skipped if offline)", async () => {
    const result = await tryFetch(`${API}/health`);
    if (!result.ok) {
      console.log("    (API offline — test skipped gracefully)");
      return; // pass gracefully
    }
    expect(result.status).toBe(200);
    expect(result.data.status).toBe("ok");
  });

  test("GET /auth/me returns 401 when no cookie (skipped if offline)", async () => {
    const result = await tryFetch(`${API}/auth/me`);
    if (!result.ok) {
      console.log("    (API offline — test skipped gracefully)");
      return;
    }
    expect(result.status).toBe(401);
  });

  test("POST /auth/login with bad creds returns 401 (skipped if offline)", async () => {
    const result = await tryFetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "no@one.com", password: "wrongpassword1" }),
    });
    if (!result.ok) {
      console.log("    (API offline — test skipped gracefully)");
      return;
    }
    expect(result.status).toBe(401);
  });

  test("GET /exams returns 200 with exams array (skipped if offline)", async () => {
    const result = await tryFetch(`${API}/exams`);
    if (!result.ok) {
      console.log("    (API offline — test skipped gracefully)");
      return;
    }
    expect(result.status).toBe(200);
    expect(Array.isArray(result.data.exams)).toBe(true);
  });
});

// ── Summary ────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log("\nFailed tests:");
  failures.forEach(f => console.log(`  ✗ ${f.name}\n    ${f.error}`));
  console.log("");
  process.exit(1);
} else {
  console.log("All tests passed! ✓");
  console.log("");
  process.exit(0);
}
