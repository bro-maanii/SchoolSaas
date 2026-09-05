import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

async function main() {
  const school = await prisma.school.upsert({
    where: { id: "demo-school" },
    update: {},
    create: {
      id: "demo-school",
      name: "Greenwood Academy",
      address: "Lahore, Pakistan",
    },
  });

  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@greenwood.test" },
    update: {},
    create: {
      schoolId: school.id,
      name: "Ayesha Khan",
      email: "admin@greenwood.test",
      passwordHash,
      role: "SCHOOL_ADMIN",
    },
  });

  await seedTrainingCenter();

  console.log({ school: school.name, admin: admin.email });
}

// Placeholder training content (Phase 7) — real recordings/screen-captures
// come later; this is deliberately labelled "dummy" in the UI copy so nobody
// mistakes it for finished material. Same tiny public sample clip on every
// video item — small enough to load instantly, purely to show the layout.
const DUMMY_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

type SeedItem = { id: string; type: "VIDEO" | "TEXT" | "FAQ"; title: string; content: string; orderIndex: number };
type SeedModule = {
  id: string;
  slug: string;
  featureArea: string;
  title: string;
  description: string;
  orderIndex: number;
  items: SeedItem[];
};

const TRAINING_MODULES: SeedModule[] = [
  {
    id: "training-dashboard",
    slug: "dashboard",
    featureArea: "Dashboard",
    title: "Dashboard",
    description: "Reading your school's daily snapshot at a glance.",
    orderIndex: 0,
    items: [
      {
        id: "training-dashboard-video",
        type: "VIDEO",
        title: "A tour of the Dashboard (dummy video — placeholder)",
        content: DUMMY_VIDEO_URL,
        orderIndex: 0,
      },
      {
        id: "training-dashboard-steps",
        type: "TEXT",
        title: "Step-by-step",
        content:
          "1. Open Dashboard from the sidebar — it's the first thing you see after logging in.\n" +
          "2. Use the month and class filters at the top-right to scope every widget on the page at once.\n" +
          "3. The yellow alert strip (if shown) flags anything that needs attention today — click View to jump straight there.\n" +
          "4. Each number card shows a small +/- line underneath comparing it to the previous period.",
        orderIndex: 1,
      },
      {
        id: "training-dashboard-faq-1",
        type: "FAQ",
        title: "Why is a number showing as 0 or —?",
        content:
          "That widget genuinely has no data yet for the selected month — for example, no invoices have been generated for that period. It isn't an error.",
        orderIndex: 2,
      },
      {
        id: "training-dashboard-faq-2",
        type: "FAQ",
        title: "Do I see the same Dashboard as everyone else?",
        content:
          "No — Teachers see a small \"My Class Today\" summary, Accountants see fee-focused numbers only, and School Admins/Principals see the full dashboard. This matches what each role is allowed to see.",
        orderIndex: 3,
      },
    ],
  },
  {
    id: "training-students",
    slug: "students",
    featureArea: "Students",
    title: "Student Management",
    description: "Adding students, guardians, and bulk imports.",
    orderIndex: 1,
    items: [
      {
        id: "training-students-video",
        type: "VIDEO",
        title: "Adding a new student (dummy video — placeholder)",
        content: DUMMY_VIDEO_URL,
        orderIndex: 0,
      },
      {
        id: "training-students-steps",
        type: "TEXT",
        title: "Step-by-step",
        content:
          "1. Go to Students → Add Student.\n" +
          "2. Fill in the student's details, then their class and section.\n" +
          "3. Add at least one guardian with a WhatsApp-reachable phone number — this is who gets notified later.\n" +
          "4. Save. Need to add many students at once? Use Students → Bulk Import and upload a CSV instead.",
        orderIndex: 1,
      },
      {
        id: "training-students-faq-1",
        type: "FAQ",
        title: "Two siblings share one parent — do I add the guardian twice?",
        content:
          "No. Add the same guardian phone number on both students and the system automatically links them to one shared guardian record — that parent gets one message, not two, even when both kids are marked absent.",
        orderIndex: 2,
      },
      {
        id: "training-students-faq-2",
        type: "FAQ",
        title: "What happens if my CSV has an error in one row?",
        content:
          "Bulk Import previews every row and flags problems before anything is saved — you fix the flagged rows and re-upload; valid rows aren't blocked by one bad row.",
        orderIndex: 3,
      },
    ],
  },
  {
    id: "training-attendance",
    slug: "attendance",
    featureArea: "Attendance",
    title: "Attendance",
    description: "Marking daily attendance and reading the register.",
    orderIndex: 2,
    items: [
      {
        id: "training-attendance-video",
        type: "VIDEO",
        title: "Marking today's attendance (dummy video — placeholder)",
        content: DUMMY_VIDEO_URL,
        orderIndex: 0,
      },
      {
        id: "training-attendance-steps",
        type: "TEXT",
        title: "Step-by-step",
        content:
          "1. Go to Attendance → Mark Attendance — it's always locked to today's date.\n" +
          "2. Tap Present / Absent / Late / Leave for each student, or use \"Mark all present\" first and only change the exceptions.\n" +
          "3. Any student marked Absent appears in the panel below with a Send Notification button — this is a manual send, nothing goes out automatically.\n" +
          "4. Use Attendance → Register to see the whole month's marks in one grid, and School Calendar to set holidays and weekly off days.",
        orderIndex: 1,
      },
      {
        id: "training-attendance-faq-1",
        type: "FAQ",
        title: "Can I mark yesterday's attendance if I forgot?",
        content:
          "Teachers can only mark today. A School Admin can go back and correct a previous day's record if needed.",
        orderIndex: 2,
      },
      {
        id: "training-attendance-faq-2",
        type: "FAQ",
        title: "Does the parent get a message the moment I mark someone absent?",
        content:
          "No — nothing is sent automatically. You (or the school admin) choose when to send it with the Send Notification button.",
        orderIndex: 3,
      },
    ],
  },
  {
    id: "training-fees",
    slug: "fees",
    featureArea: "Fees",
    title: "Fee Management",
    description: "Fee structure, invoices, payments, and defaulters.",
    orderIndex: 3,
    items: [
      {
        id: "training-fees-video",
        type: "VIDEO",
        title: "Recording a fee payment (dummy video — placeholder)",
        content: DUMMY_VIDEO_URL,
        orderIndex: 0,
      },
      {
        id: "training-fees-steps",
        type: "TEXT",
        title: "Step-by-step",
        content:
          "1. Set up each class's fee amounts once under Fees → Fee Structure.\n" +
          "2. Each month, click \"Generate this month's invoices\" on the Fees dashboard — safe to click more than once, it never creates duplicates.\n" +
          "3. To record a payment: Fees → Record Payment, search the student, pick the invoice, enter the amount.\n" +
          "4. Fees → Defaulters lists everyone with an outstanding balance for the selected month, with a one-click reminder button.",
        orderIndex: 1,
      },
      {
        id: "training-fees-faq-1",
        type: "FAQ",
        title: "What if I accidentally try to record too much payment?",
        content:
          "The system rejects a payment larger than the remaining balance, and won't let you pay an invoice that's already fully paid — so you can't accidentally overpay.",
        orderIndex: 2,
      },
      {
        id: "training-fees-faq-2",
        type: "FAQ",
        title: "Can a Teacher see fee information?",
        content: "No — fees are visible only to School Admin, Principal, and Accountant.",
        orderIndex: 3,
      },
    ],
  },
  {
    id: "training-communication",
    slug: "communication",
    featureArea: "Communication",
    title: "Communication",
    description: "Templates, notifications, and broadcast messages.",
    orderIndex: 4,
    items: [
      {
        id: "training-communication-video",
        type: "VIDEO",
        title: "Sending a broadcast message (dummy video — placeholder)",
        content: DUMMY_VIDEO_URL,
        orderIndex: 0,
      },
      {
        id: "training-communication-steps",
        type: "TEXT",
        title: "Step-by-step",
        content:
          "1. Go to Communication → Broadcast Message.\n" +
          "2. Step 1: choose who receives it — everyone, one class, one section, a hand-picked list, students absent today, or fee defaulters.\n" +
          "3. Step 2: write your message, or start from a saved template — the live preview shows exactly what a real parent would see.\n" +
          "4. Step 3: confirm the recipient count and send. Communication → Message History shows delivery status per recipient afterwards.",
        orderIndex: 1,
      },
      {
        id: "training-communication-faq-1",
        type: "FAQ",
        title: "Is this connected to a real WhatsApp number yet?",
        content:
          "Not yet — every send in this demo is simulated (no live WhatsApp Business connection is configured), but the message content, recipients, and delivery log are all real and ready for a live connection to be switched on later.",
        orderIndex: 2,
      },
      {
        id: "training-communication-faq-2",
        type: "FAQ",
        title: "A guardian has two children in the audience I picked — do they get two messages?",
        content: "No — recipients are de-duplicated by phone number, so a shared parent only ever gets one copy.",
        orderIndex: 3,
      },
    ],
  },
];

async function seedTrainingCenter() {
  for (const module of TRAINING_MODULES) {
    await prisma.trainingModule.upsert({
      where: { id: module.id },
      update: {
        slug: module.slug,
        featureArea: module.featureArea,
        title: module.title,
        description: module.description,
        orderIndex: module.orderIndex,
      },
      create: {
        id: module.id,
        slug: module.slug,
        featureArea: module.featureArea,
        title: module.title,
        description: module.description,
        orderIndex: module.orderIndex,
      },
    });

    for (const item of module.items) {
      await prisma.trainingItem.upsert({
        where: { id: item.id },
        update: {
          type: item.type,
          title: item.title,
          content: item.content,
          orderIndex: item.orderIndex,
        },
        create: {
          id: item.id,
          moduleId: module.id,
          type: item.type,
          title: item.title,
          content: item.content,
          orderIndex: item.orderIndex,
        },
      });
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
