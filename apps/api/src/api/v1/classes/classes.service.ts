import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/app-error";
import { toAppError } from "@/lib/prisma-errors";
import { CreateClassInput, CreateSectionInput, UpdateClassInput, UpdateSectionInput } from "./classes.validation";

export async function listClasses(schoolId: string, includeArchived: boolean) {
  return prisma.class.findMany({
    where: { schoolId, ...(includeArchived ? {} : { isArchived: false }) },
    orderBy: { orderIndex: "asc" },
    include: {
      sections: {
        where: includeArchived ? {} : { isArchived: false },
        orderBy: { name: "asc" },
      },
      _count: { select: { students: { where: { status: "ACTIVE" } } } },
    },
  });
}

async function getOwnedClass(schoolId: string, classId: string) {
  const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
  if (!cls) throw AppError.notFound("Class not found");
  return cls;
}

export async function createClass(schoolId: string, input: CreateClassInput) {
  try {
    return await prisma.class.create({
      data: { schoolId, name: input.name, orderIndex: input.orderIndex ?? 0 },
      include: { sections: true },
    });
  } catch (err) {
    toAppError(err, `A class named "${input.name}" already exists`);
  }
}

export async function updateClass(schoolId: string, classId: string, input: UpdateClassInput) {
  await getOwnedClass(schoolId, classId);
  try {
    return await prisma.$transaction(async (tx) => {
      const updated = await tx.class.update({
        where: { id: classId },
        data: input,
        include: { sections: true },
      });
      // Archiving a class removes it from active pickers; its sections
      // should go with it so a student can't be assigned to a "live"
      // section under a class that no longer accepts enrollment.
      if (input.isArchived === true) {
        await tx.section.updateMany({ where: { classId }, data: { isArchived: true } });
      }
      return updated;
    });
  } catch (err) {
    toAppError(err, `A class named "${input.name}" already exists`);
  }
}

export async function createSection(schoolId: string, classId: string, input: CreateSectionInput) {
  await getOwnedClass(schoolId, classId);
  try {
    return await prisma.section.create({ data: { classId, name: input.name } });
  } catch (err) {
    toAppError(err, `Section "${input.name}" already exists in this class`);
  }
}

export async function updateSection(
  schoolId: string,
  classId: string,
  sectionId: string,
  input: UpdateSectionInput
) {
  await getOwnedClass(schoolId, classId);
  const section = await prisma.section.findFirst({ where: { id: sectionId, classId } });
  if (!section) throw AppError.notFound("Section not found");

  try {
    return await prisma.section.update({ where: { id: sectionId }, data: input });
  } catch (err) {
    toAppError(err, `Section "${input.name}" already exists in this class`);
  }
}
