export type SearchResultCategory = "Student" | "Class" | "Training";

export type SearchResult = {
  id: string;
  category: SearchResultCategory;
  label: string;
  sublabel: string;
  href: string;
};
