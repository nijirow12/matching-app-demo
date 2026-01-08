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
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 h-[100dvh] w-screen overflow-hidden overscroll-none touch-pan-y`}
        >
          <SignedIn>
            <Header />
            <main className="h-[100dvh] pt-16 w-full overflow-hidden relative">
              {children}
            </main>
          </SignedIn>
          <SignedOut>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-rose-500 to-orange-500 text-white p-6 text-center">
              <div className="mb-8 bg-white/20 p-6 rounded-full shadow-2xl backdrop-blur-sm animate-pulse">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-2.222-2.222-3-3 2.048 2.653.862 5.723-.5 6.772-1.635 1.071-2.663-1.928-2.5-3.5 0 2.5 2.5 7 8 7" />
                  <path d="M15.5 14.5A2.5 2.5 0 0 1 13 12c0-1.38.5-2 1-3 1.072-2.143 2.222-2.222 3-3-2.048 2.653-.862 5.723.5 6.772 1.635 1.071 2.663-1.928 2.5-3.5 0 2.5-2.5 7-8 7" />
                </svg>
              </div>
              <h1 className="text-4xl font-extrabold mb-4 tracking-tight drop-shadow-md">
                MUSASHINO MATCHES
              </h1>
              <p className="text-lg opacity-90 max-w-sm mb-10 leading-relaxed">
                Swipe right to connect with people nearby. Start your journey today!
              </p>
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <SignUpButton mode="modal">
                  <button className="w-full bg-white text-rose-600 font-bold py-4 rounded-xl shadow-lg hover:bg-gray-50 active:scale-95 transition-all">
                    Create Account
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="w-full bg-transparent border-2 border-white/40 text-white font-bold py-4 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
                    Sign In
                  </button>
                </SignInButton>
              </div>
              <p className="mt-12 text-xs opacity-60">© 2024 MatchingApp Inc.</p>
            </div>
          </SignedOut>
        </body>
      </html>
    </ClerkProvider>
  );
}
