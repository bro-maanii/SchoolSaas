export type TrainingItemType = "VIDEO" | "TEXT" | "FAQ";

export type TrainingModuleSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  featureArea: string;
  itemCount: number;
  viewedCount: number;
};

export type TrainingItem = {
  id: string;
  type: TrainingItemType;
  title: string;
  content: string;
  viewed: boolean;
};

export type TrainingModuleDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  featureArea: string;
  items: TrainingItem[];
};
