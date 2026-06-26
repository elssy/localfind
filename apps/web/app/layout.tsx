import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { AppDataProvider } from "../context/AppDataContext";

export const metadata: Metadata = {
  title: "Local Find Admin",
  description: "Local Find admin console",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-darkText antialiased">
        <AppDataProvider>
          <Sidebar />
          <div className="ml-60 flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 p-8">{children}</main>
          </div>
        </AppDataProvider>
      </body>
    </html>
  );
}
