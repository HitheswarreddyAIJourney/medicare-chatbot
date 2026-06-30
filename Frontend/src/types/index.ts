export interface User {
  username: string;
  role: string;
  fullName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  role: string;
  username: string;
}

export interface Source {
  source_document: string;
  section_title: string;
  collection: string;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  retrieval_type: "hybrid_rag" | "sql_rag";
  role: string;
}

export interface CollectionsResponse {
  role: string;
  collections: string[];
}

export interface HealthResponse {
  status: string;
  version?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  retrievalType?: "hybrid_rag" | "sql_rag";
  timestamp: Date;
}

export type Role = "doctor" | "nurse" | "billing_executive" | "technician" | "admin";

export const DEMO_USERS: Record<Role, { username: string; password: string; fullName: string }> = {
  doctor: { username: "dr.mehta", password: "Doctor#1", fullName: "Dr. Mehta" },
  nurse: { username: "nurse.priya", password: "Nurse#1", fullName: "Nurse Priya" },
  billing_executive: { username: "billing.ravi", password: "Billing#1", fullName: "Ravi" },
  technician: { username: "tech.anand", password: "Tech#1", fullName: "Anand" },
  admin: { username: "admin.sys", password: "Admin#1", fullName: "System Admin" },
};

export const ROLE_LABELS: Record<Role, string> = {
  doctor: "Doctor",
  nurse: "Nurse",
  billing_executive: "Billing Executive",
  technician: "Technician",
  admin: "Admin",
};

export const ROLE_COLLECTIONS: Record<Role, string[]> = {
  doctor: ["clinical", "general"],
  nurse: ["nursing", "general"],
  billing_executive: ["billing", "general"],
  technician: ["equipment", "general"],
  admin: ["clinical", "nursing", "billing", "equipment", "general"],
};

export const COLLECTION_LABELS: Record<string, string> = {
  clinical: "Clinical Protocols",
  nursing: "Nursing Procedures",
  billing: "Billing & Insurance",
  equipment: "Equipment Manuals",
  general: "General",
};