import { EditStudentView } from "./edit-student-view";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditStudentView studentId={id} />;
}
