import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KFIQ Dashboard — Intern Onboarding",
  description: "Complete your KFIQ internship registration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
