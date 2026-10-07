import argon2 from "argon2";
import { Temporal } from "@js-temporal/polyfill";
import { db } from "@examconnect/database";

async function main() {
  console.log("Seeding / updating initial development data...");

  // 1. Ensure test student user exists
  const testEmail = "eligibility-test@example.com";
  let studentUser = await db.orm.public.User.where({ email: testEmail }).first();
  if (!studentUser) {
    const passwordHash = await argon2.hash("EligibilityTest123!", {
      type: argon2.argon2id,
    });
    studentUser = await db.orm.public.User.create({
      email: testEmail,
      passwordHash,
      role: "STUDENT",
      isActive: true,
      updatedAt: Temporal.Now.instant(),
    });
    console.log("Created student user:", studentUser.email);
  } else {
    console.log("Student user already exists:", studentUser.email);
  }

  // 2. Ensure admin user exists
  const adminEmail = "admin@example.com";
  let adminUser = await db.orm.public.User.where({ email: adminEmail }).first();
  if (!adminUser) {
    const adminPasswordHash = await argon2.hash("AdminPass123!", {
      type: argon2.argon2id,
    });
    adminUser = await db.orm.public.User.create({
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true,
      updatedAt: Temporal.Now.instant(),
    });
    console.log("Created admin user:", adminUser.email);
  }

  // 3. Ensure student profile exists
  let studentProfile = await db.orm.public.StudentProfile.where({ userId: studentUser.id }).first();
  if (!studentProfile) {
    studentProfile = await db.orm.public.StudentProfile.create({
      userId: studentUser.id,
      firstName: "Rahul",
      lastName: "Sharma",
      dateOfBirth: Temporal.Instant.from("2000-05-15T00:00:00Z"),
      gender: "Male",
      state: "Delhi",
      category: "General",
      updatedAt: Temporal.Now.instant(),
    });
    console.log("Created student profile for userId:", studentUser.id);
  } else {
    console.log("Student profile already exists");
  }

  // Update or insert education record with B.Tech
  const existingEdus = await db.orm.public.EducationRecord.where({ studentProfileId: studentProfile.id }).all();
  if (existingEdus.length === 0) {
    await db.orm.public.EducationRecord.create({
      studentProfileId: studentProfile.id,
      qualification: "B.Tech",
      courseName: "Bachelor of Technology",
      institutionName: "Delhi Technological University",
      boardOrUniversity: "DTU",
      passingYear: 2022,
      percentage: 82.5,
      stream: "Engineering",
      updatedAt: Temporal.Now.instant(),
    });
    console.log("Created student education record");
  } else {
    for (const edu of existingEdus) {
      await db.orm.public.EducationRecord.where({ id: edu.id }).update({
        qualification: "B.Tech",
        courseName: "Bachelor of Technology",
        updatedAt: Temporal.Now.instant(),
      });
    }
    console.log("Updated existing education records to B.Tech");
  }

  // 4. Ensure sample exams exist
  const existingExams = await db.orm.public.Exam.all();
  if (existingExams.length === 0) {
    console.log("Creating sample exams...");

    // Exam 1: UPSC Civil Services Examination
    const exam1 = await db.orm.public.Exam.create({
      name: "Civil Services Examination 2026",
      conductingBody: "Union Public Service Commission (UPSC)",
      examType: "National",
      description: "Recruitment to prestigious civil services including IAS, IPS, and IFS.",
      officialWebsite: "https://upsc.gov.in",
      updatedAt: Temporal.Now.instant(),
    });

    const post1 = await db.orm.public.Post.create({
      examId: exam1.id,
      name: "Indian Administrative Service (IAS)",
      code: "IAS",
      department: "DoPT",
      vacancies: 180,
      qualification: "Bachelor Degree",
      description: "Premier administrative service",
      updatedAt: Temporal.Now.instant(),
    });

    await db.orm.public.ApplicationDeadline.create({
      examId: exam1.id,
      postId: post1.id,
      applicationUrl: "https://upsconline.nic.in",
      applicationStart: Temporal.Instant.from("2026-09-01T00:00:00Z"),
      applicationEnd: Temporal.Instant.from("2026-12-31T23:59:59Z"),
      examDate: Temporal.Instant.from("2027-05-25T09:00:00Z"),
      status: "OPEN",
      updatedAt: Temporal.Now.instant(),
    });

    const rule1 = await db.orm.public.EligibilityRule.create({
      examId: exam1.id,
      postId: post1.id,
      ruleType: "AGE",
      name: "Age Requirement 21 to 32",
      description: "General:32,OBC:35,SC:37,ST:37,EWS:32",
      updatedAt: Temporal.Now.instant(),
    });

    await db.orm.public.EligibilityRuleVersion.create({
      eligibilityRuleId: rule1.id,
      versionNumber: 1,
      status: "ACTIVE",
      conditionField: "age",
      operator: "BETWEEN",
      expectedValue: "21,32",
      effectiveFrom: Temporal.Now.instant(),
      updatedAt: Temporal.Now.instant(),
    });

    console.log("Sample exam 1 created!");
  } else {
    // Update posts to ensure qualification matches
    const posts = await db.orm.public.Post.all();
    for (const p of posts) {
      await db.orm.public.Post.where({ id: p.id }).update({
        qualification: "Bachelor Degree",
        updatedAt: Temporal.Now.instant(),
      });
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
