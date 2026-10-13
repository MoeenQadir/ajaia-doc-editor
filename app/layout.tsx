import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ActiveUserProvider } from "@/lib/user-context";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ajaia Docs - AI-Native Collaborative Workspace",
  description:
    "High-quality collaborative document editor prototype inspired by Google Docs for Ajaia.",
};

import { ToastProvider } from "@/components/ui/Toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 antialiased transition-colors`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ActiveUserProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            </ToastProvider>
          </ActiveUserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

