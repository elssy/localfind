import type { Metadata } from "next";
import "./globals.css";

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
      <body className="bg-background text-darkText antialiased">{children}</body>
    </html>
  );
}