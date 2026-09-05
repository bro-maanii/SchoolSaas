import { prisma } from "@/lib/prisma";
import { getTeacherSectionIds } from "@/lib/teacher-scope";

export type SearchResult = {
  id: string;
  category: "Student" | "Class" | "Training";
  label: string;
  sublabel: string;
  href: string;
};

const RESULTS_PER_CATEGORY = 5;

/**
 * A single lightweight search across the handful of things people actually
 * look up mid-task — students, classes, training articles. Respects the
 * same visibility rules as their dedicated list endpoints (a Teacher only
 * ever sees their own section's students, matching /students).
 */
export async function search(schoolId: string, role: string, userId: string, q: string): Promise<SearchResult[]> {
  const [students, classes, trainingModules] = await Promise.all([
    searchStudents(schoolId, role, userId, q),
    searchClasses(schoolId, q),
    searchTraining(q),
  ]);

  return [...students, ...classes, ...trainingModules];
}

async function searchStudents(schoolId: string, role: string, userId: string, q: string): Promise<SearchResult[]> {
  const sectionScope = role === "TEACHER" ? await getTeacherSectionIds(userId) : null;
  if (sectionScope && sectionScope.length === 0) return [];

  const students = await prisma.student.findMany({
    where: {
      schoolId,
      status: "ACTIVE",
      ...(sectionScope ? { sectionId: { in: sectionScope } } : {}),
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { rollNumber: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { class: { select: { name: true } }, section: { select: { name: true } } },
    orderBy: { fullName: "asc" },
    take: RESULTS_PER_CATEGORY,
  });

  return students.map((s) => ({
    id: s.id,
    category: "Student" as const,
    label: s.fullName,
    sublabel: `${s.class.name} - ${s.section.name} · Roll #${s.rollNumber}`,
    href: `/students/${s.id}`,
  }));
}

async function searchClasses(schoolId: string, q: string): Promise<SearchResult[]> {
  const classes = await prisma.class.findMany({
    where: { schoolId, isArchived: false, name: { contains: q, mode: "insensitive" } },
    include: { _count: { select: { students: { where: { status: "ACTIVE" } } } } },
    orderBy: { orderIndex: "asc" },
    take: RESULTS_PER_CATEGORY,
  });

  return classes.map((c) => ({
    id: c.id,
    category: "Class" as const,
    label: c.name,
    sublabel: `${c._count.students} student(s)`,
    href: "/students/classes",
  }));
}

async function searchTraining(q: string): Promise<SearchResult[]> {
  const modules = await prisma.trainingModule.findMany({
    where: {
      OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
    },
    orderBy: { orderIndex: "asc" },
    take: RESULTS_PER_CATEGORY,
  });

  return modules.map((m) => ({
    id: m.id,
    category: "Training" as const,
    label: m.title,
    sublabel: m.description ?? "Training Center",
    href: `/training/${m.slug}`,
  }));
}
