import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "APEX | Premium AI Voice UPI Expense Tracker",
  description: "A local-first, glassmorphic UPI receipt expense tracker powered by Gemini API and Web Speech synthesis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark h-full antialiased overflow-x-hidden max-w-full ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="overflow-x-hidden max-w-full bg-[#0a0a0c] text-neutral-100 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
