import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/app-error";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { LoginInput } from "./auth.validation";

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || user.status !== "ACTIVE") {
    throw AppError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw AppError.unauthorized("Invalid email or password");
  }

  const payload = { userId: user.id, schoolId: user.schoolId, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: user.id });

  return {
    accessToken,
    refreshToken,
    user: await getSessionUser(user.id),
  };
}

export async function getSessionUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.unauthorized();
  }

  let teacherAssignments: { classId: string; className: string; sectionId: string; sectionName: string }[] = [];
  if (user.role === "TEACHER") {
    const assignments = await prisma.teacherClassAssignment.findMany({
      where: { userId },
      include: { class: { select: { name: true } }, section: { select: { name: true } } },
    });
    teacherAssignments = assignments.map((a) => ({
      classId: a.classId,
      className: a.class.name,
      sectionId: a.sectionId,
      sectionName: a.section.name,
    }));
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    teacherAssignments,
  };
}

export async function refresh(refreshToken: string) {
  let decoded: { userId: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw AppError.unauthorized("Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || user.status !== "ACTIVE") {
    throw AppError.unauthorized("Account is inactive");
  }

  const accessToken = signAccessToken({
    userId: user.id,
    schoolId: user.schoolId,
    role: user.role,
  });

  return { accessToken };
}
