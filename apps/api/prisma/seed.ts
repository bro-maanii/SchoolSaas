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

  console.log({ school: school.name, admin: admin.email });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
