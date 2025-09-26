import { getCurrent } from "@/features/auth/actions";
import { redirect } from "next/navigation";
import MainDashboard from "@/components/main-dashboard";

export default async function Home() {
  const user = await getCurrent();

  if (!user) redirect("/sign-in");

  return <MainDashboard />;
}
