import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TenantIQ - Intelligent Tenant Screening",
  description: "AI-powered tenant screening platform with multi-agent analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased bg-[#0f172a] text-[#f8fafc]`}>
        {children}
      </body>
    </html>
  );
}
