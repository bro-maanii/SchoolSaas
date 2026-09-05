import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as classesApi from "@/lib/api/classes";

export const classesQueryKey = (includeArchived: boolean) => ["classes", { includeArchived }] as const;

export function useClasses(includeArchived = false) {
  return useQuery({
    queryKey: classesQueryKey(includeArchived),
    queryFn: () => classesApi.listClasses(includeArchived),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: classesApi.createClass,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, input }: { classId: string; input: Parameters<typeof classesApi.updateClass>[1] }) =>
      classesApi.updateClass(classId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, input }: { classId: string; input: Parameters<typeof classesApi.createSection>[1] }) =>
      classesApi.createSection(classId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      classId,
      sectionId,
      input,
    }: {
      classId: string;
      sectionId: string;
      input: Parameters<typeof classesApi.updateSection>[2];
    }) => classesApi.updateSection(classId, sectionId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["classes"] }),
  });
}
