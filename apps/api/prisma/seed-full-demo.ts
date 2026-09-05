/**
 * Rich demo dataset for Greenwood Academy: Classes 1-10 (a realistic mix of
 * single- and multi-section classes), ~300 students with guardians, and
 * Jan-Sep 2026 attendance + fee history. Run once with:
 *   npx tsx prisma/seed-full-demo.ts
 *
 * Wipes and regenerates all of Greenwood's transactional data (classes,
 * students, guardians, invoices, payments, attendance, notifications,
 * broadcasts) — these are all seed/test artifacts from earlier phases, not
 * real user data. Users, fee categories, the academic year, message
 * templates, notification rules, and Training Center content are untouched.
 * Riverside School (the second tenant used for isolation testing) is
 * untouched entirely.
 */
import { randomUUID } from "crypto";
import { prisma } from "../src/lib/prisma";

const SCHOOL_ID = "demo-school";
const TODAY = new Date(Date.UTC(2026, 8, 6)); // 2026-09-06, matches the session's "today"
const YEAR = 2026;

// ---------- Small helpers ----------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function weighted<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function periodLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function dueDateForPeriod(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 10));
}

// ---------- Name pools ----------

const MALE_FIRST = [
  "Ahmed", "Ali", "Hassan", "Hussain", "Bilal", "Usman", "Umar", "Zain", "Faisal", "Kamran",
  "Imran", "Tariq", "Asad", "Waqas", "Danish", "Fahad", "Hamza", "Saad", "Talha", "Rayyan",
  "Adeel", "Farhan", "Shahzad", "Zubair", "Naveed", "Rashid", "Sohail", "Junaid", "Nabeel", "Arslan",
];
const FEMALE_FIRST = [
  "Ayesha", "Fatima", "Zainab", "Sara", "Amina", "Hira", "Mehreen", "Sana", "Iqra", "Rabia",
  "Maryam", "Khadija", "Nimra", "Zara", "Warda", "Alishba", "Sadia", "Sidra", "Anum", "Farah",
  "Kiran", "Laiba", "Mahnoor", "Noor", "Rimsha", "Sumaira", "Tehmina", "Uzma", "Yumna", "Aiza",
];
const SURNAMES = [
  "Khan", "Ali", "Ahmed", "Malik", "Sheikh", "Butt", "Chaudhry", "Raza", "Iqbal", "Hussain",
  "Qureshi", "Abbasi", "Farooq", "Baig", "Mirza", "Siddiqui", "Rizvi", "Gill", "Awan", "Bhatti",
  "Javed", "Akhtar", "Saleem", "Anwar", "Rana",
];

function studentName(gender: "MALE" | "FEMALE") {
  const first = gender === "MALE" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
  const last = pick(SURNAMES);
  return { fullName: `${first} ${last}`, surname: last };
}

function guardianName(surname: string, relationship: "FATHER" | "MOTHER") {
  const first = relationship === "FATHER" ? pick(MALE_FIRST) : pick(FEMALE_FIRST);
  return `${first} ${surname}`;
}

const usedPhones = new Set<string>();
function newPhone(): string {
  let phone: string;
  do {
    phone = `+923${randomInt(0, 9)}${String(randomInt(0, 9999999)).padStart(7, "0")}`;
  } while (usedPhones.has(phone));
  usedPhones.add(phone);
  return phone;
}

// ---------- Class / section layout ----------
// "Some classes have sections, some have no" -> classes below split into
// A/B(/C) sections; the rest are a single section (no meaningful split).
const CLASS_SECTIONS: Record<number, string[]> = {
  1: ["A", "B"],
  2: ["A", "B"],
  3: ["A"],
  4: ["A", "B"],
  5: ["A", "B"],
  6: ["A"],
  7: ["A", "B"],
  8: ["A"],
  9: ["A", "B", "C"],
  10: ["A"],
};

// ---------- Holidays (Jan-Sep 2026, approximate — a realistic-looking demo calendar) ----------
const HOLIDAYS: { date: Date; label: string }[] = [
  { date: new Date(Date.UTC(2026, 1, 5)), label: "Kashmir Solidarity Day" },
  { date: new Date(Date.UTC(2026, 2, 20)), label: "Eid-ul-Fitr" },
  { date: new Date(Date.UTC(2026, 2, 21)), label: "Eid-ul-Fitr" },
  { date: new Date(Date.UTC(2026, 2, 23)), label: "Pakistan Day" },
  { date: new Date(Date.UTC(2026, 4, 1)), label: "Labour Day" },
  { date: new Date(Date.UTC(2026, 4, 27)), label: "Eid-ul-Adha" },
  { date: new Date(Date.UTC(2026, 4, 28)), label: "Eid-ul-Adha" },
  { date: new Date(Date.UTC(2026, 5, 26)), label: "Ashura" },
  { date: new Date(Date.UTC(2026, 5, 27)), label: "Ashura" },
  { date: new Date(Date.UTC(2026, 7, 14)), label: "Independence Day" },
];
const holidaySet = new Set(HOLIDAYS.map((h) => h.date.getTime()));

function isSchoolDay(date: Date): boolean {
  const dow = date.getUTCDay();
  if (dow === 0 || dow === 6) return false; // demo-school's weeklyOffDays: [0, 6]
  return !holidaySet.has(date.getTime());
}

function eachSchoolDay(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  for (let t = from.getTime(); t <= to.getTime(); t += 86_400_000) {
    const d = new Date(t);
    if (isSchoolDay(d)) days.push(d);
  }
  return days;
}

// ---------- Main ----------

async function main() {
  console.log("Wiping existing Greenwood transactional data...");
  await prisma.messageDelivery.deleteMany({});
  await prisma.notificationJob.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.broadcastCampaign.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.payment.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.invoice.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.attendanceRecord.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.studentGuardian.deleteMany({ where: { student: { schoolId: SCHOOL_ID } } });
  await prisma.teacherClassAssignment.deleteMany({ where: { class: { schoolId: SCHOOL_ID } } });
  await prisma.student.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.guardian.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.feeStructureItem.deleteMany({ where: { schoolId: SCHOOL_ID } });
  await prisma.section.deleteMany({ where: { class: { schoolId: SCHOOL_ID, isArchived: false } } });
  await prisma.class.deleteMany({ where: { schoolId: SCHOOL_ID, isArchived: false } });

  const [feeCategories, academicYear, adminUser, accountantUser, teacherUser] = await Promise.all([
    prisma.feeCategory.findMany({ where: { schoolId: SCHOOL_ID } }),
    prisma.academicYear.findFirst({ where: { schoolId: SCHOOL_ID, isCurrent: true } }),
    prisma.user.findUnique({ where: { email: "admin@greenwood.test" } }),
    prisma.user.findUnique({ where: { email: "accountant@greenwood.test" } }),
    prisma.user.findUnique({ where: { email: "teacher@greenwood.test" } }),
  ]);
  if (!academicYear) throw new Error("No current academic year found — run prisma/seed.ts first.");
  if (!adminUser || !accountantUser) throw new Error("Expected seed users not found — run prisma/seed.ts first.");
  const adminId = adminUser.id;
  const accountantId = accountantUser.id;

  const monthlyCategory = feeCategories.find((c) => c.type === "MONTHLY")!;
  const annualCategory = feeCategories.find((c) => c.type === "ANNUAL")!;
  const admissionCategory = feeCategories.find((c) => c.type === "ADMISSION")!;

  console.log("Creating classes and sections...");
  const classRows: { id: string; schoolId: string; name: string; orderIndex: number }[] = [];
  const sectionRows: { id: string; classId: string; name: string }[] = [];
  const classMeta: { classId: string; classNumber: number; sectionIds: string[] }[] = [];

  for (let n = 1; n <= 10; n++) {
    const classId = randomUUID();
    classRows.push({ id: classId, schoolId: SCHOOL_ID, name: `Class ${n}`, orderIndex: n - 1 });
    const sectionIds: string[] = [];
    for (const sectionName of CLASS_SECTIONS[n]) {
      const sectionId = randomUUID();
      sectionRows.push({ id: sectionId, classId, name: sectionName });
      sectionIds.push(sectionId);
    }
    classMeta.push({ classId, classNumber: n, sectionIds });
  }
  await prisma.class.createMany({ data: classRows });
  await prisma.section.createMany({ data: sectionRows });

  console.log("Creating fee structure...");
  const feeStructureRows = classMeta.flatMap(({ classId, classNumber }) => [
    {
      id: randomUUID(),
      schoolId: SCHOOL_ID,
      classId,
      feeCategoryId: monthlyCategory.id,
      academicYearId: academicYear.id,
      amount: 2500 + (classNumber - 1) * 400,
    },
    {
      id: randomUUID(),
      schoolId: SCHOOL_ID,
      classId,
      feeCategoryId: annualCategory.id,
      academicYearId: academicYear.id,
      amount: 4000 + (classNumber - 1) * 300,
    },
    {
      id: randomUUID(),
      schoolId: SCHOOL_ID,
      classId,
      feeCategoryId: admissionCategory.id,
      academicYearId: academicYear.id,
      amount: 8000,
    },
  ]);
  await prisma.feeStructureItem.createMany({ data: feeStructureRows });
  const monthlyAmountByClass = new Map(classMeta.map((c) => [c.classId, 2500 + (c.classNumber - 1) * 400]));
  const annualAmountByClass = new Map(classMeta.map((c) => [c.classId, 4000 + (c.classNumber - 1) * 300]));

  console.log("Adding school calendar holidays...");
  await prisma.schoolCalendarDay.createMany({
    data: HOLIDAYS.map((h) => ({ id: randomUUID(), schoolId: SCHOOL_ID, date: h.date, type: "HOLIDAY" as const, label: h.label })),
    skipDuplicates: true,
  });

  console.log("Generating students and guardians...");
  type StudentRow = {
    id: string;
    schoolId: string;
    classId: string;
    sectionId: string;
    rollNumber: string;
    fullName: string;
    dob: Date;
    gender: "MALE" | "FEMALE";
    admissionDate: Date;
    status: "ACTIVE";
  };
  const studentRows: StudentRow[] = [];
  const guardianRows: { id: string; schoolId: string; fullName: string; relationship: "FATHER" | "MOTHER"; phoneE164: string; whatsappOptIn: boolean }[] = [];
  const studentGuardianRows: { studentId: string; guardianId: string; isPrimary: boolean }[] = [];
  // Track a few already-created guardians so ~15% of students can share one with a sibling.
  const existingGuardianIds: string[] = [];

  let rollCounter = 1;
  for (const { classId, classNumber, sectionIds } of classMeta) {
    rollCounter = 1;
    for (const sectionId of sectionIds) {
      const count = randomInt(14, 20);
      for (let i = 0; i < count; i++) {
        const gender: "MALE" | "FEMALE" = Math.random() < 0.5 ? "MALE" : "FEMALE";
        const { fullName, surname } = studentName(gender);
        const birthYear = YEAR - (5 + classNumber);
        const dob = new Date(Date.UTC(birthYear, randomInt(0, 11), randomInt(1, 28)));

        const isNewThisYear = Math.random() < 0.15;
        const admissionDate = isNewThisYear
          ? new Date(Date.UTC(YEAR, randomInt(0, 7), randomInt(1, 28))) // Jan-Aug 2026
          : new Date(Date.UTC(randomInt(2020, 2025), randomInt(0, 11), randomInt(1, 28)));

        const studentId = randomUUID();
        studentRows.push({
          id: studentId,
          schoolId: SCHOOL_ID,
          classId,
          sectionId,
          rollNumber: String(rollCounter++),
          fullName,
          dob,
          gender,
          admissionDate,
          status: "ACTIVE",
        });

        // Guardian: ~15% share an existing guardian (sibling), else a new one.
        let guardianId: string;
        if (existingGuardianIds.length > 0 && Math.random() < 0.15) {
          guardianId = pick(existingGuardianIds);
        } else {
          const relationship: "FATHER" | "MOTHER" = Math.random() < 0.7 ? "FATHER" : "MOTHER";
          guardianId = randomUUID();
          guardianRows.push({
            id: guardianId,
            schoolId: SCHOOL_ID,
            fullName: guardianName(surname, relationship),
            relationship,
            phoneE164: newPhone(),
            whatsappOptIn: Math.random() > 0.05, // ~95% opted in
          });
          existingGuardianIds.push(guardianId);
        }
        studentGuardianRows.push({ studentId, guardianId, isPrimary: true });
      }
    }
  }

  // Designate 2 "at-risk" students (3+ absences + unpaid September fee) so the
  // Dashboard's alert widget has a real, guaranteed case to show — not left to chance.
  const atRiskStudentIds = [studentRows[Math.floor(studentRows.length * 0.3)].id, studentRows[Math.floor(studentRows.length * 0.6)].id];

  for (let i = 0; i < studentRows.length; i += 2000) {
    await prisma.student.createMany({ data: studentRows.slice(i, i + 2000) });
  }
  for (let i = 0; i < guardianRows.length; i += 2000) {
    await prisma.guardian.createMany({ data: guardianRows.slice(i, i + 2000) });
  }
  for (let i = 0; i < studentGuardianRows.length; i += 5000) {
    await prisma.studentGuardian.createMany({ data: studentGuardianRows.slice(i, i + 5000) });
  }
  console.log(`  ${studentRows.length} students, ${guardianRows.length} guardians created.`);

  console.log("Generating invoices and payments (Jan-Sep 2026)...");
  const invoiceRows: {
    id: string;
    schoolId: string;
    studentId: string;
    feeCategoryId: string;
    periodLabel: string;
    amountDue: number;
    amountPaid: number;
    status: "PAID" | "PARTIAL" | "UNPAID";
    dueDate: Date;
  }[] = [];
  const paymentRows: { id: string; schoolId: string; invoiceId: string; amount: number; method: "CASH" | "BANK" | "OTHER"; receivedBy: string; paidAt: Date }[] = [];

  function addInvoiceWithPayment(opts: {
    studentId: string;
    classId: string;
    feeCategoryId: string;
    label: string;
    amount: number;
    dueDate: Date;
    forceUnpaid?: boolean;
  }) {
    const invoiceId = randomUUID();
    const status = opts.forceUnpaid ? "UNPAID" : weighted<"PAID" | "PARTIAL" | "UNPAID">([["PAID", 72], ["PARTIAL", 13], ["UNPAID", 15]]);
    const amountPaid = status === "PAID" ? opts.amount : status === "PARTIAL" ? Math.round(opts.amount * (0.3 + Math.random() * 0.4)) : 0;
    invoiceRows.push({
      id: invoiceId,
      schoolId: SCHOOL_ID,
      studentId: opts.studentId,
      feeCategoryId: opts.feeCategoryId,
      periodLabel: opts.label,
      amountDue: opts.amount,
      amountPaid,
      status,
      dueDate: opts.dueDate,
    });
    if (amountPaid > 0) {
      const paidAt = new Date(opts.dueDate.getTime() + randomInt(-3, 6) * 86_400_000);
      paymentRows.push({
        id: randomUUID(),
        schoolId: SCHOOL_ID,
        invoiceId,
        amount: amountPaid,
        method: weighted([["CASH", 55], ["BANK", 40], ["OTHER", 5]]),
        receivedBy: accountantId,
        paidAt: paidAt > TODAY ? TODAY : paidAt,
      });
    }
  }

  for (const student of studentRows) {
    const monthlyAmount = monthlyAmountByClass.get(student.classId)!;
    const annualAmount = annualAmountByClass.get(student.classId)!;
    const admissionYear = student.admissionDate.getUTCFullYear();
    const admissionMonth = student.admissionDate.getUTCMonth() + 1; // 1-12
    const isAtRisk = atRiskStudentIds.includes(student.id);

    // Monthly tuition, from admission month (or Jan if admitted before 2026) through September.
    const startMonth = admissionYear < YEAR ? 1 : admissionMonth;
    for (let m = startMonth; m <= 9; m++) {
      addInvoiceWithPayment({
        studentId: student.id,
        classId: student.classId,
        feeCategoryId: monthlyCategory.id,
        label: periodLabel(YEAR, m),
        amount: monthlyAmount,
        dueDate: dueDateForPeriod(YEAR, m),
        forceUnpaid: isAtRisk && m === 9,
      });
    }

    // Annual charges — everyone currently enrolled pays this year's annual charges once.
    addInvoiceWithPayment({
      studentId: student.id,
      classId: student.classId,
      feeCategoryId: annualCategory.id,
      label: academicYear.label,
      amount: annualAmount,
      dueDate: admissionYear < YEAR ? new Date(Date.UTC(YEAR, 0, 15)) : student.admissionDate,
    });

    // Admission fee — one-time, only for students actually admitted this academic year.
    if (admissionYear === YEAR) {
      addInvoiceWithPayment({
        studentId: student.id,
        classId: student.classId,
        feeCategoryId: admissionCategory.id,
        label: academicYear.label,
        amount: 8000,
        dueDate: student.admissionDate,
      });
    }
  }

  for (let i = 0; i < invoiceRows.length; i += 3000) {
    await prisma.invoice.createMany({ data: invoiceRows.slice(i, i + 3000) });
  }
  for (let i = 0; i < paymentRows.length; i += 3000) {
    await prisma.payment.createMany({ data: paymentRows.slice(i, i + 3000) });
  }
  console.log(`  ${invoiceRows.length} invoices, ${paymentRows.length} payments created.`);

  console.log("Generating attendance records (Jan 1 - Sep 5, 2026)... this is the slow part.");
  const rangeStart = new Date(Date.UTC(YEAR, 0, 1));
  const rangeEnd = new Date(Date.UTC(YEAR, 8, 5)); // yesterday relative to "today" 2026-09-06 — leaves today unmarked for a live demo
  const allSchoolDays = eachSchoolDay(rangeStart, rangeEnd);
  const septemberSchoolDaysSoFar = allSchoolDays.filter((d) => d.getUTCMonth() === 8);

  let attendanceBuffer: {
    id: string;
    schoolId: string;
    studentId: string;
    classId: string;
    sectionId: string;
    date: Date;
    status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
    markedBy: string;
  }[] = [];
  let attendanceTotal = 0;

  async function flushAttendance() {
    if (attendanceBuffer.length === 0) return;
    await prisma.attendanceRecord.createMany({ data: attendanceBuffer });
    attendanceTotal += attendanceBuffer.length;
    attendanceBuffer = [];
  }

  for (const student of studentRows) {
    const isAtRisk = atRiskStudentIds.includes(student.id);
    // ~6% of students are frequent absentees — a realistic long tail, not uniform randomness.
    const isFrequentAbsentee = !isAtRisk && Math.random() < 0.06;
    const absentProb = isFrequentAbsentee ? 0.22 : 0.05;

    const schoolDaysForStudent = allSchoolDays.filter((d) => d.getTime() >= student.admissionDate.getTime());

    let forcedAbsencesUsed = 0;
    for (const date of schoolDaysForStudent) {
      let status: "PRESENT" | "ABSENT" | "LATE" | "LEAVE";
      if (isAtRisk && date.getUTCMonth() === 8 && forcedAbsencesUsed < 3 && septemberSchoolDaysSoFar.some((d) => d.getTime() === date.getTime())) {
        status = "ABSENT";
        forcedAbsencesUsed += 1;
      } else {
        status = weighted<"PRESENT" | "ABSENT" | "LATE" | "LEAVE">([
          ["PRESENT", (1 - absentProb) * 100 - 4],
          ["ABSENT", absentProb * 100],
          ["LATE", 3],
          ["LEAVE", 1],
        ]);
      }
      attendanceBuffer.push({
        id: randomUUID(),
        schoolId: SCHOOL_ID,
        studentId: student.id,
        classId: student.classId,
        sectionId: student.sectionId,
        date,
        status,
        markedBy: adminId,
      });
      if (attendanceBuffer.length >= 8000) await flushAttendance();
    }
  }
  await flushAttendance();
  console.log(`  ${attendanceTotal} attendance records created.`);

  console.log("Re-assigning the demo teacher account...");
  const class5 = classMeta.find((c) => c.classNumber === 5)!;
  if (teacherUser) {
    await prisma.teacherClassAssignment.create({
      data: { userId: teacherUser.id, classId: class5.classId, sectionId: class5.sectionIds[0] },
    });
  }

  console.log("Done.");
  console.log({
    classes: classRows.length,
    sections: sectionRows.length,
    students: studentRows.length,
    guardians: guardianRows.length,
    invoices: invoiceRows.length,
    payments: paymentRows.length,
    attendanceRecords: attendanceTotal,
    holidays: HOLIDAYS.length,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
