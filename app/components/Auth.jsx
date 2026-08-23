"use client";

import { SignIn } from "@clerk/nextjs";

export default function Auth() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <SignIn routing="hash" />
    </div>
  );
}
