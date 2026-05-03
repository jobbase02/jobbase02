export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  role_category: string | null;
  batch_eligible: string[] | null;
  experience_required: string | null;
  apply_link: string;
  description_text: string | null;
  created_at: string;
  similarity?: number;
}

export interface FilterState {
  role_category: string;
  location: string;
  experience_required: string;
  batch_year: string;
}

export const EMPTY_FILTERS: FilterState = {
  role_category: "",
  location: "",
  experience_required: "",
  batch_year: "",
};

export const FILTER_OPTIONS = {
  role_category: ["SDE", "Data", "DevOps", "QA", "Design", "Product", "Business Analyst", "Marketing", "Finance", "HR", "Support"],
  location: ["Remote", "Bangalore", "Hyderabad", "Mumbai", "Pune", "Chennai", "Delhi", "Noida", "Gurgaon"],
  experience_required: ["Fresher", "1-3 Years", "3-5 Years", "5+ Years"],
  batch_year: ["2023", "2024", "2025", "2026"],
} as const;

export interface AIMessage {
  role: "user" | "assistant" | "error";
  content: string;
  jobs?: Job[];
}
