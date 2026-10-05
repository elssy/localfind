import { redirect } from "next/navigation";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import SampleDataNotice from "../../components/SampleDataNotice";
import { AppDataProvider } from "../../context/AppDataContext";
import { getSessionUser } from "../../lib/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only administrators may see anything in this area. Having a session is not
  // enough: a seeker or provider who signs in here is sent back to the login page.
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/login");

  return (
    <AppDataProvider>
      <Sidebar />
      <div className="ml-60 flex min-h-screen flex-col">
        <Header />
        <SampleDataNotice />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </AppDataProvider>
  );
}
