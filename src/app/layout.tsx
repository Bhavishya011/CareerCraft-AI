import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AppHeader from "@/components/app-header";
import AppFooter from "@/components/app-footer";
import AuthListener from "@/components/Authlistener";
import LayoutClientWrapper from "../components/LayoutClientWrapper";

export const metadata: Metadata = {
  title: "TypeWise AI",
  description:
    "TypeWise AI helps you create polished, personalized messages for any career goal — from cover letters to outreach emails — instantly. Just input your intent, tone, and key points, and get a ready-to-use message in seconds. Built for students, professionals, and job seekers who value clarity, speed, and impact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthListener />
        <LayoutClientWrapper>
          {children}
        </LayoutClientWrapper>
        <Toaster />
      </body>
    </html>
  );
}
