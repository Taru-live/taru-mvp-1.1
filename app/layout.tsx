import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProvider from "./components/SessionProvider";
import DataRecoveryUI from "./components/DataRecoveryUI";
import InactivityMonitor from "./components/InactivityMonitor";
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
  title: "Taru – AI-Driven Career Guidance & Structured Learning for Students in India",
  description: "Taru helps students across India discover clear career pathways through ethical AI, structured learning journeys, skill assessments, and multilingual support - guiding students from school to professional readiness.",
  keywords: "AI career guidance, structured learning, skill assessments, multilingual education, student career paths, India education, ethical AI learning",
  authors: [{ name: "Taru Team" }],
  creator: "Taru",
  publisher: "Taru",
  robots: "index, follow",
  openGraph: {
    title: "Taru – AI-Driven Career Guidance & Structured Learning for Students in India",
    description: "Taru helps students across India discover clear career pathways through ethical AI, structured learning journeys, skill assessments, and multilingual support.",
    type: "website",
    locale: "en_US",
    url: "https://taru.live",
    siteName: "Taru",
    images: [
      {
        url: "/icons/og-image.png",
        width: 1200,
        height: 630,
        alt: "Taru – AI-Driven Career Guidance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Taru – AI-Driven Career Guidance & Structured Learning",
    description: "Guiding students from school to professional readiness through ethical AI and structured learning.",
    images: ["/icons/og-image.png"],
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/webclip.png",
  },
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
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <style dangerouslySetInnerHTML={{
          __html: `* {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -o-font-smoothing: antialiased;
}`
        }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} body antialiased bg-white text-gray-900 selection:bg-purple-200 selection:text-purple-900`}
        suppressHydrationWarning={true}
      >
        <SessionProvider>
          {children}
          <InactivityMonitor />
          <DataRecoveryUI />
          <Toaster position="top-right" richColors />
        </SessionProvider>
      </body>
    </html>
  );
}
