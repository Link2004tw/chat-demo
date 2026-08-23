// app/page.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function LandingPage() {
  const { isLoaded, isSignedIn } = useUser();

  // Redirect signed-in users to chat immediately
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      redirect("/chat");
    }
  }, [isLoaded, isSignedIn]);

  // Show loading while Clerk checks auth state
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  // Not signed in → show landing
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-gray-100 flex flex-col">
      {/* Hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 tracking-tight">
          <span className="text-indigo-400">ChatApp</span>
        </h1>

        <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mb-10">
          Simple, fast, real-time chat — built with Next.js, Fastify and TypeScript.
        </p>

        <div className="flex flex-col sm:flex-row gap-5">
          <Link
            href="/sign-up"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-lg transition shadow-lg shadow-indigo-500/20"
          >
            Create free account
          </Link>

          <Link
            href="/sign-in"
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl text-lg border border-gray-700 transition"
          >
            Sign in
          </Link>
        </div>
      </main>

      {/* Small footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-gray-800">
        Built while learning TypeScript + Fastify • Link {new Date().getFullYear()}
      </footer>
    </div>
  );
}