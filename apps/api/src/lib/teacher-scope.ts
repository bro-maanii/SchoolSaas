import { prisma } from "./prisma";

/** Section ids a teacher is the class-incharge for — scopes their read access to students/attendance. */
export async function getTeacherSectionIds(userId: string): Promise<string[]> {
  const assignments = await prisma.teacherClassAssignment.findMany({
    where: { userId },
    select: { sectionId: true },
  });
  return assignments.map((a) => a.sectionId);
}
