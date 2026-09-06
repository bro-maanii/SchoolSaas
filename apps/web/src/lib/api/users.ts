import { api } from "@/lib/api-client";
import type { CreateUserInput, StaffUser, UpdateUserInput, UsersResponse } from "@/types/users";

export function listUsers() {
  return api.get<UsersResponse>("/users");
}

export function createUser(input: CreateUserInput) {
  return api.post<StaffUser>("/users", input);
}

export function updateUser(id: string, input: UpdateUserInput) {
  return api.patch<StaffUser>(`/users/${id}`, input);
}

export function updateUserStatus(id: string, status: "ACTIVE" | "INACTIVE") {
  return api.patch<StaffUser>(`/users/${id}/status`, { status });
}

export function deleteUser(id: string) {
  return api.delete<{ success: boolean }>(`/users/${id}`);
}
