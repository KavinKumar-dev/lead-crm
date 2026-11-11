import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM System",
  description: "Multi-Client Lead Management & Follow-Up CRM System",
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
