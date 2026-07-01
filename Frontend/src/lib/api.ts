import axios from "axios";
import type { LoginRequest, LoginResponse, ChatResponse, CollectionsResponse, HealthResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/login", credentials);
  return response.data;
}

export async function chat(question: string, token: string): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>(
    "/chat",
    { question },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
}

export async function getCollections(role: string): Promise<CollectionsResponse> {
  const response = await api.get<CollectionsResponse>(`/collections/${role}`);
  return response.data;
}

export async function healthCheck(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>("/health");
  return response.data;
}

export default api;