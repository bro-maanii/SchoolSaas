import { TrainingModuleView } from "@/features/training/training-module-view";

export default async function TrainingModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TrainingModuleView slug={slug} />;
}
