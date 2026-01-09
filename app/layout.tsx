import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import PerformanceMonitor from "./components/PerformanceMonitor";
import DataRecoveryUI from "./components/DataRecoveryUI";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Taru - AI-Powered Educational Platform",
  description: "A comprehensive AI-powered educational platform for personalized learning experiences. Built for students, parents, teachers, and administrators.",
  keywords: "education, AI, learning, personalized, students, teachers, assessment, modules",
  authors: [{ name: "Taru Team" }],
  creator: "Taru",
  publisher: "Taru",
  robots: "index, follow",
  openGraph: {
    title: "Taru - AI-Powered Educational Platform",
    description: "Transform learning with AI-powered personalized education",
    type: "website",
    locale: "en_US",
    url: "https://taru.live",
    siteName: "Taru",
    images: [
      {
        url: "/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "Taru - AI-Powered Educational Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taru - AI-Powered Educational Platform",
    description: "Transform learning with AI-powered personalized education",
    images: ["/icons/og-image.png"],
  },
  icons: {
    icon: "/icons/logo.svg",
    shortcut: "/icons/logo.svg",
    apple: "/icons/logo.svg",
  },
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6D18CE",
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white text-gray-900 selection:bg-purple-200 selection:text-purple-900`}
        suppressHydrationWarning={true}
      >
        <SessionProvider>
          {children}
          <DataRecoveryUI />
          <PerformanceMonitor 
            enabled={true}
            showInDevelopment={true}
          />
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
