import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { Header } from "@/components/Header";
import { LandingPage } from "@/components/LandingPage";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MUSASHINO MATCHES",
  description: "Find your perfect match in Musashino.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="ja">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 h-[100dvh] w-screen`}
        >
          <SignedIn>
            <Header />
            <main className="h-[100dvh] pt-16 w-full relative">
              {children}
            </main>
          </SignedIn>
          <SignedOut>
            <LandingPage />
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
