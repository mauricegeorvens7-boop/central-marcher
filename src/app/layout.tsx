import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ClientSoundNotifier } from "@/components/SoundNotifications";
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
  title: {
    default: "Central Market | Modern commerce platform",
    template: "%s | Central Market",
  },
  description:
    "Original e-commerce platform with catalog, marketplace, pickup, delivery, checkout, support, and admin dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-950">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <ClientSoundNotifier />
      </body>
    </html>
  );
}
