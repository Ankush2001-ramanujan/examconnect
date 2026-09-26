/**
 * apps/api/src/__tests__/api.test.ts
 *
 * Full backend API test suite using Vitest + Fastify's inject() method
 * (no actual HTTP server needed — Fastify inject() bypasses the network).
 *
 * Coverage:
 *  - Health checks
 *  - Auth: register, login, /auth/me, logout
 *  - Input validation errors (400)
 *  - Auth guards (401 on protected routes without session)
 *  - Student profile CRUD
 *  - Student education CRUD
 *  - Eligible exams endpoint
 *  - Student notifications
 *  - Public exams routes
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";

// Route registrations
import { registerRoute } from "../auth/register.js";
import { loginRoute } from "../auth/login.js";
import { logoutRoute } from "../auth/logout.js";
import { meRoute } from "../auth/me.js";
import { protectedRoute } from "../auth/protected.js";
import { studentRoute } from "../student.js";
import { eligibilityRoute } from "../eligibility/eligibility.js";
import { examRoute } from "../exams.js";
import { studentNotificationRoute } from "../student-notifications.js";
import { adminExamRoute } from "../admin-exams.js";
import { adminNotificationSourceRoute } from "../admin-notification-sources.js";

// ── Helpers ──────────────────────────────────────────────────────────

/** Build a complete Fastify app instance (same as production index.ts) */
async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(cookie);

  app.get("/health", async () => ({ status: "ok", service: "api" }));
  app.get("/health/db", async () => {
    // Skip actual DB call in unit tests — just return ok
    return { status: "ok", service: "database" };
  });

  await registerRoute(app);
  await loginRoute(app);
  await logoutRoute(app);
  await meRoute(app);
  await protectedRoute(app);
  await studentRoute(app);
  await eligibilityRoute(app);
  await examRoute(app);
  await studentNotificationRoute(app);
  await adminExamRoute(app);
  await adminNotificationSourceRoute(app);

  return app;
}

/** Generate a unique test email to avoid conflicts between test runs */
function uniqueEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

/** Extract Set-Cookie header from a Fastify response */
function extractCookieHeader(
  response: Awaited<ReturnType<FastifyInstance["inject"]>>,
): string {
  const raw = response.headers["set-cookie"];
  if (!raw) return "";
  if (Array.isArray(raw)) return raw.join("; ");
  return raw;
}

// ── Test state shared across auth tests ──────────────────────────────
let app: FastifyInstance;
let sessionCookie: string = "";
const testEmail = uniqueEmail();
const testPassword = "TestPassword123!";

// ── Setup / Teardown ──────────────────────────────────────────────────

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

// ═════════════════════════════════════════════════════════════════════
// 1. Health Checks
// ═════════════════════════════════════════════════════════════════════

describe("Health endpoints", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("api");
  });
});

// ═════════════════════════════════════════════════════════════════════
// 2. CORS preflight
// ═════════════════════════════════════════════════════════════════════

describe("CORS", () => {
  it("OPTIONS /auth/login returns 204 with CORS headers for allowed origin", async () => {
    const res = await app.inject({
      method: "OPTIONS",
      url: "/auth/login",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });
    // Fastify cors returns 204 for preflight
    expect([200, 204]).toContain(res.statusCode);
    expect(
      res.headers["access-control-allow-origin"]
    ).toBe("http://localhost:3000");
  });
});

// ═════════════════════════════════════════════════════════════════════
// 3. Registration
// ═════════════════════════════════════════════════════════════════════

describe("POST /auth/register", () => {
  it("400 on missing body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("INVALID_INPUT");
  });

  it("400 on invalid email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: "not-an-email", password: "StrongPass123!" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("400 on short password (< 8 chars)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: uniqueEmail(), password: "short" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("201 on valid registration", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: testEmail, password: testPassword },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(testEmail);
    expect(body.user.role).toBe("STUDENT");
    expect(body.user.id).toBeTypeOf("number");
  });

  it("409 on duplicate email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { email: testEmail, password: testPassword },
    });
    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body.error).toBe("EMAIL_ALREADY_EXISTS");
  });
});

// ═════════════════════════════════════════════════════════════════════
// 4. Login
// ═════════════════════════════════════════════════════════════════════

describe("POST /auth/login", () => {
  it("400 on empty body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: {},
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("INVALID_INPUT");
  });

  it("401 on wrong password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: testEmail, password: "WrongPassword999!" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("INVALID_CREDENTIALS");
  });

  it("401 on non-existent user", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: "nobody@doesnotexist.com", password: "Password123!" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("200 on valid login and sets session cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: testEmail, password: testPassword },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe(testEmail);

    // Extract the session cookie for subsequent tests
    const cookieHeader = extractCookieHeader(res);
    expect(cookieHeader).toContain("examconnect_session");
    sessionCookie = cookieHeader;
  });
});

// ═════════════════════════════════════════════════════════════════════
// 5. GET /auth/me
// ═════════════════════════════════════════════════════════════════════

describe("GET /auth/me", () => {
  it("401 without session cookie", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
    expect(res.json().error).toBe("UNAUTHENTICATED");
  });

  it("200 with valid session cookie", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.email).toBe(testEmail);
    expect(body.user.role).toBe("STUDENT");
  });
});

// ═════════════════════════════════════════════════════════════════════
// 6. Auth guard — generic protected route tests
// ═════════════════════════════════════════════════════════════════════

describe("Auth guards", () => {
  const protectedEndpoints = [
    { method: "GET",    url: "/student/profile" },
    { method: "PUT",    url: "/student/profile" },
    { method: "GET",    url: "/student/education" },
    { method: "POST",   url: "/student/education" },
    { method: "GET",    url: "/student/eligible-exams" },
    { method: "GET",    url: "/student/notifications" },
  ] as const;

  for (const { method, url } of protectedEndpoints) {
    it(`${method} ${url} returns 401 without cookie`, async () => {
      const res = await app.inject({ method, url });
      expect(res.statusCode).toBe(401);
    });
  }

  it("GET /admin/test returns 403 for STUDENT role", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/admin/test",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error).toBe("FORBIDDEN");
  });
});

// ═════════════════════════════════════════════════════════════════════
// 7. Student Profile
// ═════════════════════════════════════════════════════════════════════

describe("Student Profile", () => {
  it("PUT /student/profile 400 on missing firstName", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/student/profile",
      headers: { cookie: sessionCookie },
      payload: { lastName: "Test" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("INVALID_INPUT");
  });

  it("PUT /student/profile 201/200 creates profile", async () => {
    const res = await app.inject({
      method: "PUT",
      url: "/student/profile",
      headers: { cookie: sessionCookie },
      payload: {
        firstName: "Test",
        lastName: "Student",
        gender: "Male",
        state: "Delhi",
        category: "General",
      },
    });
    expect([200, 201]).toContain(res.statusCode);
    const body = res.json();
    expect(body.profile.firstName).toBe("Test");
    expect(body.profile.state).toBe("Delhi");
  });

  it("GET /student/profile 200 returns saved profile", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/student/profile",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.profile.firstName).toBe("Test");
  });
});

// ═════════════════════════════════════════════════════════════════════
// 8. Education Records
// ═════════════════════════════════════════════════════════════════════

describe("Student Education", () => {
  let educationId: number;

  it("POST /student/education 400 on missing qualification", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/student/education",
      headers: { cookie: sessionCookie },
      payload: { courseName: "B.Tech" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("POST /student/education 201 creates education record", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/student/education",
      headers: { cookie: sessionCookie },
      payload: {
        qualification: "B.Tech",
        courseName: "Computer Science",
        passingYear: 2022,
        percentage: 78.5,
        stream: "CS",
        institutionName: "IIT Delhi",
        boardOrUniversity: "IIT Delhi",
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.education.qualification).toBe("B.Tech");
    educationId = body.education.id;
    expect(educationId).toBeTypeOf("number");
  });

  it("GET /student/education 200 returns records list", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/student/education",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.education)).toBe(true);
    expect(body.education.length).toBeGreaterThan(0);
    expect(body.education.some((r: any) => r.id === educationId)).toBe(true);
  });

  it("PUT /student/education/:id 200 updates record", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/student/education/${educationId}`,
      headers: { cookie: sessionCookie },
      payload: { percentage: 82.0 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Number(body.education.percentage)).toBe(82);
  });

  it("DELETE /student/education/:id 200 deletes record", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/student/education/${educationId}`,
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(body.deletedId).toBe(educationId);
  });

  it("DELETE /student/education/:id 404 after already deleted", async () => {
    const res = await app.inject({
      method: "DELETE",
      url: `/student/education/${educationId}`,
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 9. Eligible Exams (requires profile to exist — runs after profile tests)
// ═════════════════════════════════════════════════════════════════════

describe("GET /student/eligible-exams", () => {
  it("200 returns results array", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/student/eligible-exams",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("results");
    expect(Array.isArray(body.results)).toBe(true);
  });

  it("Each result has expected shape", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/student/eligible-exams",
      headers: { cookie: sessionCookie },
    });
    const { results } = res.json();
    for (const r of results) {
      expect(r).toHaveProperty("exam");
      expect(r).toHaveProperty("eligible");
      expect(r).toHaveProperty("reasons");
      expect(r).toHaveProperty("sources");
      expect(r).toHaveProperty("deadlines");
      expect(r.exam).toHaveProperty("id");
      expect(r.exam).toHaveProperty("name");
      expect(typeof r.eligible).toBe("boolean");
      expect(Array.isArray(r.reasons)).toBe(true);
    }
  });
});

// ═════════════════════════════════════════════════════════════════════
// 10. Student Notifications
// ═════════════════════════════════════════════════════════════════════

describe("Student Notifications", () => {
  it("GET /student/notifications 200 returns array", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/student/notifications",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("notifications");
    expect(Array.isArray(body.notifications)).toBe(true);
  });

  it("PATCH /student/notifications/read-all 200", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/student/notifications/read-all",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe("ok");
    expect(typeof body.updatedCount).toBe("number");
  });

  it("PATCH /student/notifications/999999/read returns 404", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: "/student/notifications/999999/read",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 11. Public Exams routes (no auth required)
// ═════════════════════════════════════════════════════════════════════

describe("Public Exams", () => {
  it("GET /exams 200 returns array", async () => {
    const res = await app.inject({ method: "GET", url: "/exams" });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty("exams");
    expect(Array.isArray(body.exams)).toBe(true);
  });

  it("GET /exams/:id 400 on non-integer ID", async () => {
    const res = await app.inject({ method: "GET", url: "/exams/abc" });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("INVALID_ID");
  });

  it("GET /exams/999999 404 for non-existent exam", async () => {
    const res = await app.inject({ method: "GET", url: "/exams/999999" });
    expect(res.statusCode).toBe(404);
  });
});

// ═════════════════════════════════════════════════════════════════════
// 12. Logout
// ═════════════════════════════════════════════════════════════════════

describe("POST /auth/logout", () => {
  it("200 and clears cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/logout",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("ok");
  });

  it("GET /auth/me returns 401 after logout", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { cookie: sessionCookie },
    });
    expect(res.statusCode).toBe(401);
  });
});
