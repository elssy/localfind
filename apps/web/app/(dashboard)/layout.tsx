import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { AppDataProvider } from "../../context/AppDataContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppDataProvider>
      <Sidebar />
      <div className="ml-60 flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </AppDataProvider>
  );
}