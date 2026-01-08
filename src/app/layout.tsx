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

import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import "./globals.css";
import Link from "next/link";
import { User, Flame, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Matching App",
  description: "Find your perfect match.",
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
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 overflow-hidden`}
        >
          <SignedIn>
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 h-16">
              <div className="max-w-xl mx-auto h-full px-6 flex items-center justify-between">

                {/* Profile Link */}
                <Link href="/profile" className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                  <User size={28} strokeWidth={2.5} />
                </Link>

                {/* Main Logo (Home) */}
                <Link href="/" className="p-2">
                  <div className="bg-gradient-to-tr from-rose-500 to-orange-500 text-white rounded-full p-1.5 shadow-lg hover:scale-105 transition-transform">
                    <Flame size={28} fill="currentColor" strokeWidth={0} />
                  </div>
                </Link>

                {/* Chat Link (Placeholder) */}
                <Link href="/chat" className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                  <MessageCircle size={28} strokeWidth={2.5} />
                </Link>

              </div>
            </header>
            <main className="pt-16 h-[100dvh]">
              {children}
            </main>
          </SignedIn>

          <SignedOut>
            <div className="flex min-h-screen flex-col items-center justify-center p-4">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-500 mb-8">
                Matching App
              </h1>
              <div className="flex gap-4">
                <SignInButton mode="modal">
                  <button className="px-6 py-3 bg-rose-500 text-white rounded-full font-bold shadow-lg hover:bg-rose-600 transition-all">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-6 py-3 bg-white text-gray-800 border border-gray-200 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-all">
                    Sign Up
                  </button>
                </SignUpButton>
              </div>
            </div>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
