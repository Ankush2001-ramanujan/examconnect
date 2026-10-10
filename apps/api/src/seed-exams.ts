import { Temporal } from "@js-temporal/polyfill";
import { db } from "@examconnect/database";


const exams = [
  {
    name: "SSC CHSL 2026",
    conductingBody: "Staff Selection Commission (SSC)",
    description: "Combined Higher Secondary Level exam (LDC/JSA/DEO).",
    officialWebsite: "https://ssc.gov.in",
    post: { name: "LDC / JSA / DEO", code: "CHSL", department: "Various Ministries", vacancies: 0, qualification: "12th Pass" },
    dates: { start: "2026-10-01", end: "2027-01-15", exam: "2027-03-15" },
    age: { min: 18, max: 27, relax: "General:27,OBC:30,SC:32,ST:32,EWS:27" },
  },
  {
    name: "SSC MTS 2026",
    conductingBody: "Staff Selection Commission (SSC)",
    description: "Multi Tasking Staff (Non-Technical) recruitment.",
    officialWebsite: "https://ssc.gov.in",
    post: { name: "Multi Tasking Staff", code: "MTS", department: "Various Ministries", vacancies: 0, qualification: "10th Pass" },
    dates: { start: "2026-12-01", end: "2027-01-15", exam: "2027-04-15" },
    age: { min: 18, max: 25, relax: "General:25,OBC:28,SC:30,ST:30,EWS:25" },
  },
  {
    name: "SSC CPO 2026",
    conductingBody: "Staff Selection Commission (SSC)",
    description: "Sub-Inspector in Delhi Police and CAPFs.",
    officialWebsite: "https://ssc.gov.in",
    post: { name: "Sub-Inspector (SI)", code: "CPO", department: "Delhi Police / CAPF", vacancies: 0, qualification: "Bachelor Degree" },
    dates: { start: "2026-12-01", end: "2027-01-15", exam: "2027-03-01" },
    age: { min: 20, max: 25, relax: "General:25,OBC:28,SC:30,ST:30,EWS:25" },
  },
  {
    name: "SSC GD Constable 2026",
    conductingBody: "Staff Selection Commission (SSC)",
    description: "Constable (GD) in CAPFs, NIA, SSF and Rifleman (GD) in Assam Rifles.",
    officialWebsite: "https://ssc.gov.in",
    post: { name: "Constable (GD)", code: "GD", department: "CAPF / NIA / SSF / AR", vacancies: 0, qualification: "10th Pass" },
    dates: { start: "2026-12-01", end: "2027-01-15", exam: "2027-03-20" },
    age: { min: 18, max: 23, relax: "General:23,OBC:26,SC:28,ST:28,EWS:23" },
  },
  {
    name: "UPSC Civil Services 2026",
    conductingBody: "Union Public Service Commission (UPSC)",
    description: "Official recruitment for IAS, IPS, IFS and Central Group A services based on the 2026 calendar.",
    officialWebsite: "https://upsc.gov.in",
    post: { name: "Civil Services Officers", code: "CSE", department: "Various Central Ministries", vacancies: 933, qualification: "Bachelor Degree" },
    dates: { start: "2026-02-04", end: "2026-02-27", exam: "2026-05-24" },
    age: { min: 21, max: 32, relax: "General:32,OBC:35,SC:37,ST:37,EWS:32" },
  },
  {
    name: "IBPS PO 2026",
    conductingBody: "Institute of Banking Personnel Selection (IBPS)",
    description: "Official CRP PO/MT-XVI recruitment for Probationary Officers in participating Public Sector Banks.",
    officialWebsite: "https://ibps.in",
    post: { name: "Probationary Officer", code: "BANK-PO", department: "11 Participating Nationalized Banks", vacancies: 7565, qualification: "Bachelor Degree" },
    dates: { start: "2026-07-25", end: "2026-08-16", exam: "2026-08-22" },
    age: { min: 20, max: 30, relax: "General:30,OBC:33,SC:35,ST:35,EWS:30" },
  },
  {
    name: "RRB NTPC Graduate 2026",
    conductingBody: "Railway Recruitment Boards (RRB)",
    description: "Official CEN 06/2026 Graduate Level recruitment for Station Master, Goods Train Manager, and Senior Clerk.",
    officialWebsite: "https://rrcb.gov.in",
    post: { name: "Graduate Level Posts", code: "NTPC-GRAD", department: "Indian Railways", vacancies: 3548, qualification: "Bachelor Degree" },
    dates: { start: "2026-10-08", end: "2026-11-06", exam: "2026-12-20" },
    age: { min: 18, max: 33, relax: "General:33,OBC:36,SC:38,ST:38,EWS:33" },
  },
  
];

async function main() {
  for (const e of exams) {
    const existing = await db.orm.public.Exam.where({ name: e.name }).first();

    if (existing) {
      console.log("Already exists, skipping:", e.name);
      continue;
    }

    const exam = await db.orm.public.Exam.create({
      name: e.name,
      conductingBody: e.conductingBody,
      examType: "National",
      description: e.description,
      officialWebsite: e.officialWebsite,
      updatedAt: Temporal.Now.instant(),
    });

    const post = await db.orm.public.Post.create({
      examId: exam.id,
      ...e.post,
      description: e.description,
      updatedAt: Temporal.Now.instant(),
    });

    await db.orm.public.ApplicationDeadline.create({
      examId: exam.id,
      postId: post.id,
      applicationUrl: e.officialWebsite,
      applicationStart: Temporal.Instant.from(`${e.dates.start}T00:00:00Z`),
      applicationEnd: Temporal.Instant.from(`${e.dates.end}T23:59:59Z`),
      examDate: Temporal.Instant.from(`${e.dates.exam}T09:00:00Z`),
      status: "OPEN",
      updatedAt: Temporal.Now.instant(),
    });

    //  Yeh block database mein backend ke rules (comma format) ke hisab se entries create karega
    const rule = await db.orm.public.EligibilityRule.create({
      examId: exam.id,
      postId: post.id,
      ruleType: "AGE",
      name: `${e.name} Age Limit Rule`,
      description: e.age.relax,
      updatedAt: Temporal.Now.instant(),
    });

    await db.orm.public.EligibilityRuleVersion.create({
      eligibilityRuleId: rule.id,
      versionNumber: 1,
      status: "ACTIVE",
      conditionField: "age",
      operator: "BETWEEN",
      expectedValue: `${e.age.min},${e.age.max}`, // Backend evaluator ke array-split ke liye standard format
      effectiveFrom: Temporal.Now.instant(),
      updatedAt: Temporal.Now.instant(),
    });

    console.log("Successfully seeded exam:", e.name);
  }
}

main().catch((err) => {
  console.error("Error during seeding process:", err);
  process.exit(1);
});
