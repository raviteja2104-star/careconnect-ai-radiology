import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider, ThemeScript } from "@/components/providers/ThemeProvider";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ToastProvider } from "@/components/ui/toast";
import { TourProvider } from "@/components/tour/TourProvider";
import { AppShell } from "@/components/shell/AppShell";
import { PermissionProvider } from "@/contexts/PermissionContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "CareConnect — Healthcare Operating System",
  description: "Premium enterprise healthcare platform for patients, clinicians, and operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        <ThemeProvider>
          <SessionProvider>
            <PermissionProvider>
              <QueryProvider>
                <ToastProvider>
                  <TourProvider>
                    <AppShell>{children}</AppShell>
                  </TourProvider>
                </ToastProvider>
              </QueryProvider>
            </PermissionProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
