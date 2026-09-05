import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as attendanceApi from "@/lib/api/attendance";

export function useRoster(params: { classId?: string; sectionId?: string; date?: string }) {
  return useQuery({
    queryKey: ["attendance", "roster", params],
    queryFn: () => attendanceApi.getRoster({ classId: params.classId!, sectionId: params.sectionId!, date: params.date }),
    enabled: !!params.classId && !!params.sectionId,
  });
}

export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.markAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCorrectAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof attendanceApi.correctAttendance>[1] }) =>
      attendanceApi.correctAttendance(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useAttendanceRegister(params: { classId?: string; sectionId?: string; from: string; to: string }) {
  return useQuery({
    queryKey: ["attendance", "register", params],
    queryFn: () => attendanceApi.getRegister(params),
  });
}

export function useStudentAttendanceHistory(studentId: string | undefined) {
  return useQuery({
    queryKey: ["attendance", "history", studentId],
    queryFn: () => attendanceApi.getStudentAttendanceHistory(studentId!),
    enabled: !!studentId,
  });
}

export function useCalendar() {
  return useQuery({ queryKey: ["attendance", "calendar"], queryFn: attendanceApi.getCalendar });
}

export function useAddHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.addHoliday,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "calendar"] }),
  });
}

export function useRemoveHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.removeHoliday,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "calendar"] }),
  });
}

export function useSetWeeklyOffDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.setWeeklyOffDays,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "calendar"] }),
  });
}

export function useSendAbsenceNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attendanceApi.sendAbsenceNotification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }),
  });
}
