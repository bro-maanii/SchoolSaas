import { StudentProfileView } from "./student-profile-view";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentProfileView studentId={id} />;
}
