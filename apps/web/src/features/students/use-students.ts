import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as studentsApi from "@/lib/api/students";
import type { ListStudentsParams } from "@/lib/api/students";

export function useStudents(params: ListStudentsParams) {
  return useQuery({
    queryKey: ["students", params],
    queryFn: () => studentsApi.listStudents(params),
    placeholderData: (prev) => prev,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: ["students", "detail", id],
    queryFn: () => studentsApi.getStudent(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentsApi.createStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof studentsApi.updateStudent>[1] }) =>
      studentsApi.updateStudent(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", variables.id] });
    },
  });
}

export function useDeactivateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: studentsApi.deactivateStudent,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
}
