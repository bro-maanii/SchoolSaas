import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/app-error";

// Platform-wide content — no schoolId scoping, same for every school. Any
// authenticated user can browse; the only per-user state is which items
// they've opened (TrainingView).

export async function listModules(userId: string) {
  const modules = await prisma.trainingModule.findMany({
    orderBy: { orderIndex: "asc" },
    include: { items: { select: { id: true } } },
  });

  const itemIds = modules.flatMap((m) => m.items.map((i) => i.id));
  const views = itemIds.length
    ? await prisma.trainingView.findMany({ where: { userId, itemId: { in: itemIds } }, select: { itemId: true } })
    : [];
  const viewedIds = new Set(views.map((v) => v.itemId));

  return modules.map((m) => ({
    id: m.id,
    slug: m.slug,
    title: m.title,
    description: m.description,
    featureArea: m.featureArea,
    itemCount: m.items.length,
    viewedCount: m.items.filter((i) => viewedIds.has(i.id)).length,
  }));
}

export async function getModuleBySlug(slug: string, userId: string) {
  const trainingModule = await prisma.trainingModule.findUnique({
    where: { slug },
    include: { items: { orderBy: { orderIndex: "asc" } } },
  });
  if (!trainingModule) throw AppError.notFound("Training module not found");

  const views = await prisma.trainingView.findMany({
    where: { userId, itemId: { in: trainingModule.items.map((i) => i.id) } },
    select: { itemId: true },
  });
  const viewedIds = new Set(views.map((v) => v.itemId));

  return {
    id: trainingModule.id,
    slug: trainingModule.slug,
    title: trainingModule.title,
    description: trainingModule.description,
    featureArea: trainingModule.featureArea,
    items: trainingModule.items.map((i) => ({
      id: i.id,
      type: i.type,
      title: i.title,
      content: i.content,
      viewed: viewedIds.has(i.id),
    })),
  };
}

export async function markItemViewed(itemId: string, userId: string) {
  const item = await prisma.trainingItem.findUnique({ where: { id: itemId } });
  if (!item) throw AppError.notFound("Training item not found");

  await prisma.trainingView.upsert({
    where: { userId_itemId: { userId, itemId } },
    update: { viewedAt: new Date() },
    create: { userId, itemId },
  });
}
