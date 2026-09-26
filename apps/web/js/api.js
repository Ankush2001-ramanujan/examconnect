/**
 * api.js — Centralized fetch() wrapper for all apps/api calls.
 * All requests use credentials:"include" for cookie-based auth.
 */

const API_URL = "http://localhost:4000";

/**
 * Core fetch wrapper. Throws on non-OK HTTP responses.
 * @param {string} path
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Response body is not JSON (e.g. 204 No Content)
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return data;
}

/* ── Auth ─────────────────────────────────────────────────── */

/** GET /auth/me → { user } or throws 401 */
async function authMe() {
  return apiFetch("/auth/me", { cache: "no-store" });
}

/** POST /auth/login → { user } */
async function authLogin(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

/** POST /auth/logout */
async function authLogout() {
  return apiFetch("/auth/logout", { method: "POST" });
}

/* ── Student – Eligible Exams ─────────────────────────────── */

/** GET /student/eligible-exams → { results } */
async function getEligibleExams() {
  return apiFetch("/student/eligible-exams", { cache: "no-store" });
}

/* ── Student – Profile ────────────────────────────────────── */

/** GET /student/profile → { profile } */
async function getProfile() {
  return apiFetch("/student/profile", { cache: "no-store" });
}

/**
 * PUT /student/profile → { profile }
 * @param {{ firstName, lastName?, dateOfBirth?, gender?, state?, category? }} payload
 */
async function saveProfile(payload) {
  return apiFetch("/student/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/* ── Student – Education ──────────────────────────────────── */

/** GET /student/education → { education } */
async function getEducation() {
  return apiFetch("/student/education", { cache: "no-store" });
}

/**
 * POST /student/education → { education }
 * @param {object} payload
 */
async function addEducation(payload) {
  return apiFetch("/student/education", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /student/education/:id → { education }
 * @param {number} id
 * @param {object} payload
 */
async function updateEducation(id, payload) {
  return apiFetch(`/student/education/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /student/education/:id → { status, deletedId }
 * @param {number} id
 */
async function deleteEducation(id) {
  return apiFetch(`/student/education/${id}`, { method: "DELETE" });
}
