# 🎓 ExamConnect

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Fastify](https://img.shields.io/badge/Fastify-v5.0-black.svg)](https://www.fastify.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

**ExamConnect** is a centralized competitive examination portal and automated student eligibility matching platform. Designed to eliminate the friction and confusion of navigating scattered government and public examination notifications, ExamConnect cross-references student educational qualifications, age criteria, category reservations, and academic streams against examination criteria in real time.

---

## 📑 Table of Contents

- [Features](#-features)
- [System Architecture](#-system-architecture)
- [Monorepo Workspace Structure](#-monorepo-workspace-structure)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Environment Variables](#2-environment-variables)
  - [3. Start Infrastructure (Docker)](#3-start-infrastructure-docker)
  - [4. Install Dependencies](#4-install-dependencies)
  - [5. Database Setup & Seeding](#5-database-setup--seeding)
  - [6. Run Development Servers](#6-run-development-servers)
- [Default Seed Accounts](#-default-seed-accounts)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Directory Layout](#-directory-layout)
- [License](#-license)

---

## ✨ Features

- **Automated Eligibility Engine**:
  - Compares candidate profile (Date of Birth / Age, Highest Qualification, Stream, Percentage, Category, State) against dynamic eligibility rule sets.
  - Provides precise breakdown of pass/fail criteria per exam post.
- **Comprehensive Exam Catalog**:
  - Filter by national and state-level conducting bodies (UPSC, SSC, Banking, State PSCs, etc.).
  - Detailed post vacancies, department breakdowns, and official portal links.
- **Application Deadline Tracking**:
  - Never miss an exam window with tracking for registration start dates, closing deadlines, and tentative exam dates.
- **Secure Authentication & Profiles**:
  - Secure session-based authentication using **Argon2id** password hashing and HTTP-only cookies.
  - Multi-record education history management (High School, Intermediate, Undergrad, Postgrad).
- **Admin Management Console**:
  - Create and manage exams, posts, rule versions, and official notification sources.
- **Background Worker Ready**:
  - BullMQ and Redis pipeline for scheduled scraping and notification delivery.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend["apps/web (Vanilla HTML5 / CSS3 / ES Modules)"]
        UI[Student Dashboard & Exam Directory]
        ProfileUI[Profile & Education Manager]
        ModalUI[Eligibility & Application Detail Modal]
    end

    subgraph Backend["apps/api (Fastify 5 + TypeScript)"]
        Auth[Auth Module (Argon2id + HTTP-only Cookie)]
        Student[Student Profile & Education Routes]
        EligEngine[Rule Evaluator & Matching Engine]
        AdminExams[Admin Exam & Rule Management]
    end

    subgraph Worker["apps/worker (BullMQ)"]
        Jobs[Notification & Sync Jobs]
    end

    subgraph Storage["Databases & Infrastructure (Docker)"]
        Postgres[(PostgreSQL 17)]
        Redis[(Redis 7)]
    end

    UI -->|REST / JSON| Backend
    ProfileUI -->|REST / JSON| Backend
    ModalUI -->|REST / JSON| Backend
    Backend -->|Prisma Client / ORM| Postgres
    Backend -->|Enqueue| Redis
    Jobs -->|Dequeue / Process| Redis
    Jobs -->|Query / Update| Postgres
```

---

## 📦 Monorepo Workspace Structure

ExamConnect is organized as a high-performance monorepo using **pnpm workspaces**:

| Path | Package | Role |
| :--- | :--- | :--- |
| `apps/web` | `web` | Responsive, lightweight frontend using HTML5, modern CSS3, and ES6 JavaScript. |
| `apps/api` | `@examconnect/api` | REST API service powered by Fastify, TypeScript, and Argon2. |
| `apps/worker` | `@examconnect/worker` | Background job processing queue with BullMQ and ioredis. |
| `packages/database` | `@examconnect/database` | Database schema definitions, Prisma ORM bindings, and migrations. |
| `packages/config` | `@examconnect/config` | Shared TypeScript and toolchain configurations. |
| `packages/types` | `@examconnect/types` | Shared domain and API contract TypeScript type definitions. |
| `packages/validation`| `@examconnect/validation`| Shared Zod validation schemas for request validation. |

---

## 🛠️ Tech Stack

- **Runtime & Language**: Node.js (v20+), TypeScript 5, Modern Vanilla JavaScript (ES Modules)
- **API Framework**: [Fastify v5](https://fastify.dev/) with `@fastify/cors` and `@fastify/cookie`
- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System, Dark/Glassmorphism Theme), Vanilla JavaScript
- **Database & ORM**: PostgreSQL 17, [Prisma](https://www.prisma.io/)
- **Cache & Queue**: Redis 7, [BullMQ](https://bullmq.io/)
- **Security**: Argon2 (`argon2id`) password hashing
- **Testing**: Vitest v3, Supertest, Node.js Test Runner
- **Containerization**: Docker Compose

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) `>= 20.0.0`
- [pnpm](https://pnpm.io/) `>= 9.0.0` (or `npm`)
- [Docker](https://www.docker.com/) & Docker Compose

---

## 🚀 Getting Started

### 1. Clone Repository

```bash
git clone https://github.com/Ankush2001-ramanujan/examconnect.git
cd examconnect
```

### 2. Environment Variables

Create your local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Default configuration in `.env`:
```env
POSTGRES_DB=examconnect
POSTGRES_USER=examconnect
POSTGRES_PASSWORD=change_me
DATABASE_URL=postgresql://examconnect:change_me@localhost:5432/examconnect
```

### 3. Start Infrastructure (Docker)

Spin up PostgreSQL 17 and Redis 7 in the background:

```bash
docker compose up -d
```

To verify containers are healthy:
```bash
docker compose ps
```

### 4. Install Dependencies

Install all monorepo dependencies:

```bash
pnpm install
```

### 5. Database Setup & Seeding

Populate the database with sample exams (UPSC Civil Services, etc.), eligibility rules, and pre-configured test users:

```bash
pnpm --filter @examconnect/api seed
```

### 6. Run Development Servers

Start both the backend API and frontend concurrently:

```bash
# Start both apps concurrently
pnpm dev
```

Or run services individually:

```bash
# Terminal 1: Backend Fastify API (Runs on http://localhost:4000)
pnpm dev:api

# Terminal 2: Frontend Web App (Runs on http://localhost:3000)
pnpm dev:web

# Optional: Background Worker
pnpm --filter @examconnect/worker dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Default Seed Accounts

The database seed provides two default accounts for testing:

### 1. Student Account (Pre-configured with B.Tech profile)
- **Email**: `eligibility-test@example.com`
- **Password**: `EligibilityTest123!`
- **Role**: `STUDENT`

### 2. Administrator Account
- **Email**: `admin@example.com`
- **Password**: `AdminPass123!`
- **Role**: `ADMIN`

---

## 🔌 API Reference

### Health Checks
- `GET /health` — API health status.
- `GET /health/db` — Database connectivity verification.

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new student account.
- `POST /api/auth/login` — Sign in and receive HTTP-only session cookie.
- `POST /api/auth/logout` — Invalidate current session and clear cookies.
- `GET /api/auth/me` — Retrieve currently authenticated user context.

### Student Profile (`/api/student`)
- `GET /api/student/profile` — Fetch student profile and educational history.
- `POST /api/student/profile` — Create or update student profile details.
- `POST /api/student/education` — Add or modify academic qualification records.
- `DELETE /api/student/education/:id` — Remove an education record.

### Eligibility Engine (`/api/eligibility`)
- `POST /api/eligibility/check` — Evaluate candidate qualification against a specific exam or post rule set.
- `GET /api/eligibility/matched` — Retrieve all exams matching the authenticated student's profile.

### Exam Catalog (`/api/exams`)
- `GET /api/exams` — List all published exams with deadline summaries.
- `GET /api/exams/:id` — Retrieve comprehensive exam details, posts, and eligibility criteria.

### Admin Management (`/api/admin`)
- `POST /api/admin/exams` — Create a new competitive exam entry.
- `PUT /api/admin/exams/:id` — Update exam metadata.
- `POST /api/admin/exams/:id/posts` — Create a post and define eligibility rule criteria.

---

## 🧪 Testing

Run automated tests across the workspace:

```bash
# Run all test suites
pnpm test

# Run API unit & integration tests (Vitest)
pnpm test:api

# Run Frontend integration test suite
pnpm test:web
```

---

## 📁 Directory Layout

```text
ExamConnect/
├── apps/
│   ├── api/                     # Fastify TypeScript REST API server
│   │   ├── src/
│   │   │   ├── auth/            # Authentication & session controllers
│   │   │   ├── eligibility/     # Rule evaluator and matching engine
│   │   │   ├── admin-exams.ts   # Admin exam endpoints
│   │   │   ├── student.ts       # Student profile & education endpoints
│   │   │   ├── seed.ts          # Database seed script
│   │   │   └── index.ts         # Fastify server bootstrap & CORS config
│   │   └── package.json
│   ├── web/                     # Client application (Vanilla HTML/CSS/JS)
│   │   ├── css/                 # Modern design system & style modules
│   │   ├── js/                  # Client-side state & API communication
│   │   ├── pages/               # Multi-page layouts (exam detail, profile)
│   │   ├── tests/               # Frontend integration tests
│   │   ├── index.html           # Main landing & dashboard view
│   │   └── package.json
│   └── worker/                  # BullMQ asynchronous background worker
│       └── src/
├── packages/
│   ├── database/                # Database layer & Prisma contract models
│   ├── config/                  # Shared configurations
│   ├── types/                   # Shared TypeScript definitions
│   └── validation/              # Shared Zod validation schemas
├── docker-compose.yml           # PostgreSQL 17 & Redis 7 services
├── pnpm-workspace.yaml          # Monorepo workspace configuration
├── package.json                 # Monorepo root scripts
└── README.md                    # Project documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
