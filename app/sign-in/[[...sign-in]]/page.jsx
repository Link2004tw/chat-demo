// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";

export default function SignInPage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                        ChatApp
                    </Link>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{" "}
                        <Link
                            href="/sign-up"
                            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                            Sign up
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main content - Centered */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                            Welcome back
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Sign in to continue to your chats
                        </p>
                    </div>

                    <div className="flex items-center justify-center">
                        <SignIn
                            appearance={{
                                baseTheme: dark,
                                variables: {
                                    colorPrimary: "#4f46e5",
                                    borderRadius: "1rem", // Rounded edges
                                },
                                elements: {
                                    rootBox: "w-full",
                                    card: "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-2xl", // Extra rounded
                                    headerTitle: "text-gray-900 dark:text-white text-2xl font-bold",
                                    headerSubtitle: "text-gray-600 dark:text-gray-400",
                                    socialButtonsBlockButton:
                                        "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors rounded-xl",
                                    socialButtonsBlockButtonText: "text-gray-900 dark:text-white font-medium",
                                    dividerLine: "bg-gray-300 dark:bg-gray-700",
                                    dividerText: "text-gray-500 dark:text-gray-500",
                                    formButtonPrimary:
                                        "bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-sm",
                                    formFieldLabel: "text-gray-700 dark:text-gray-300 font-medium",
                                    formFieldInput:
                                        "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
                                    footerActionLink: "text-indigo-600 dark:text-indigo-400 hover:underline",
                                    identityPreviewText: "text-gray-900 dark:text-white",
                                    identityPreviewEditButton: "text-indigo-600 dark:text-indigo-400",
                                    formFieldInputShowPasswordButton: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white",
                                },
                            }}
                            routing="path"
                            path="/sign-in"
                            signUpUrl="/sign-up"
                            forceRedirectUrl="/chat"
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                © {new Date().getFullYear()} ChatApp • Built with Fastify + Next.js
            </footer>
        </div>
    );
}