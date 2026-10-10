import { Temporal } from "@js-temporal/polyfill";

export type EligibilityStudent = {
  profile: {
    category: string | null;
    state: string | null;
    dateOfBirth: string | null;
  };

  education: Array<{
    qualification: string;
    percentage: number | null;
    passingYear: number | null;
    stream: string | null;
  }>;
};

export type EligibilityRule = {
  name: string;
  conditionField: string;
  operator: string;
  expectedValue: string;
  qualificationRequirement?: string | null;
  logicGroup?: string | null;
  logicOperator?: string | null;
};

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
};

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizeQualification(value: string): string {
  const normalized = normalizeText(value)
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

  const aliases: Record<string, string> = {
    ba: "ba", "b a": "ba", "bachelor of arts": "ba",
    bsc: "bsc", "b sc": "bsc", "bachelor of science": "bsc",
    bcom: "bcom", "b com": "bcom", "bachelor of commerce": "bcom",
    btech: "btech", "b tech": "btech", "bachelor of technology": "btech",
    bvoc: "bvoc", "b voc": "bvoc", "bachelor of vocational studies": "bvoc",
    ma: "ma", "m a": "ma", "master of arts": "ma",
    msc: "msc", "m sc": "msc", "master of science": "msc",
    mcom: "mcom", "m com": "mcom", "master of commerce": "mcom",
    mtech: "mtech", "m tech": "mtech", "master of technology": "mtech",
  };

  return aliases[normalized] ?? normalized;
}

function compareNumbers(actual: number, operator: string, expected: number): boolean {
  switch (operator.trim()) {
    case ">=": return actual >= expected;
    case "<=": return actual <= expected;
    case ">": return actual > expected;
    case "<": return actual < expected;
    case "=":
    case "==":
    case "EQUALS": return actual === expected;
    default: return false;
  }
}

function compareText(actual: string, operator: string, expected: string): boolean {
  const normalizedActual = normalizeText(actual);
  const normalizedExpected = expected.split(",").map((value) => normalizeText(value));

  switch (operator.trim()) {
    case "IN": return normalizedExpected.includes(normalizedActual);
    case "=":
    case "==":
    case "EQUALS": return normalizedActual === normalizeText(expected);
    default: return false;
  }
}

export function calculateAge(dateOfBirth: string, asOfDate?: string): number {
  if (!dateOfBirth) return 0;
  
  const birthStr = dateOfBirth.includes('T') ? dateOfBirth : `${dateOfBirth}T00:00:00Z`;
  const birthDate = Temporal.Instant
    .from(birthStr)
    .toZonedDateTimeISO("Asia/Kolkata")
    .toPlainDate();

  const targetDate = asOfDate
    ? Temporal.PlainDate.from(asOfDate)
    : Temporal.PlainDate.from("2026-08-01"); 

  let age = targetDate.year - birthDate.year;
  const birthdayOnTargetDate = birthDate.add({ years: age });

  if (Temporal.PlainDate.compare(targetDate, birthdayOnTargetDate) < 0) {
    age -= 1;
  }

  return age;
}

function qualificationSatisfiesRequirement(
  education: EligibilityStudent["education"],
  requirement: string,
): boolean {
  if (!requirement) return true;
  const normalizedRequirement = normalizeQualification(requirement);

  return education.some((item) => {
    const studentQual = normalizeQualification(item.qualification);
    
    if (normalizedRequirement === "graduation" || normalizedRequirement === "bachelor" || normalizedRequirement === "bachelor degree") {
      const graduationDegrees = ["ba", "bsc", "bcom", "btech", "bvoc"];
      return graduationDegrees.includes(studentQual) || studentQual.includes("bachelor");
    }
    
    if (normalizedRequirement === "12th" || normalizedRequirement === "higher secondary") {
      return studentQual === "12th" || studentQual === "higher secondary" || studentQual === "inter";
    }

    return studentQual.includes(normalizedRequirement);
  });
}

export function evaluateEligibility(
  student: EligibilityStudent,
  rules: any[]
): EligibilityResult {
  const reasons: string[] = [];
  let isEligible = true;

  if (!student.profile.dateOfBirth) {
    return { eligible: false, reasons: ["Date of birth is missing."] };
  }

  const studentAge = calculateAge(student.profile.dateOfBirth, "2026-08-01");

  for (const rule of rules) {
    let conditionPassed = false;

    if (rule.conditionField === "age") {
      if (rule.operator === "BETWEEN") {
        const separator = rule.expectedValue.includes(",") ? "," : "-";
        const [minAge, maxAge] = rule.expectedValue.split(separator).map(Number);
        conditionPassed = studentAge >= minAge && studentAge <= maxAge;
      } else {
        conditionPassed = compareNumbers(studentAge, rule.operator, Number(rule.expectedValue));
      }

      if (!conditionPassed) {
        reasons.push(`Age limit check failed: Student age is ${studentAge}, required ${rule.operator} ${rule.expectedValue}`);
        isEligible = false;
      }
    } 
    
    else if (rule.conditionField === "category") {
      conditionPassed = compareText(student.profile.category || "General", rule.operator, rule.expectedValue);
      if (!conditionPassed) {
        reasons.push(`Category '${student.profile.category}' does not satisfy the rule value '${rule.expectedValue}'.`);
        isEligible = false;
      }
    }

    if (rule.qualificationRequirement) {
      const qualPassed = qualificationSatisfiesRequirement(student.education, rule.qualificationRequirement);
      if (!qualPassed) {
        reasons.push(`Education does not meet the minimum requirement: ${rule.qualificationRequirement}.`);
        isEligible = false;
      }
    }
  }

  return {
    eligible: isEligible && reasons.length === 0,
    reasons
  };
}
