import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMZ OS",
  description: "The business operating system for Amazon wholesale sellers.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  let contacts: { id: string; companyName: string; contactName: string | null; email: string | null }[] = [];
  if (session?.user) {
    try {
      const user = await getCurrentUser();
      contacts = await prisma.supplier.findMany({
        where: { userId: user.id, archived: false },
        select: { id: true, companyName: true, contactName: true, email: true },
        orderBy: { companyName: "asc" },
      });
    } catch { /* not logged in */ }
  }

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-row bg-[var(--background)] text-[var(--foreground)]">
        {session?.user && <Sidebar userEmail={session.user.email ?? undefined} />}
        <div className="flex flex-1 flex-col" data-area="main">
          {session?.user && <TopBar contacts={contacts} />}
          {children}
        </div>
      </body>
    </html>
  );
}
