// app/user-profile/[[...user-profile]]/page.tsx
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";

export default function UserProfilePage() {
    return (
        <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
            {/* Simple header to match your app style */}
            <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <Link href="/chat" className="text-xl font-bold text-indigo-400 hover:text-indigo-300">
                        ChatApp
                    </Link>
                    <Link
                        href="/chat"
                        className="text-sm text-gray-400 hover:text-indigo-400 transition"
                    >
                        Back to Chat
                    </Link>
                </div>
            </header>

            {/* Main profile area */}
            <main className="flex-1 flex items-start justify-center p-4 md:p-8">
                <div className="w-full max-w-4xl">
                    <UserProfile
                        path="/profile"
                        routing="path"
                        appearance={{
                            baseTheme: dark,
                            variables: {
                                colorPrimary: "#4f46e5",          // indigo-600
                                colorPrimaryForeground: "#ffffff",
                                colorText: "#f3f4f6",             // gray-100
                                colorTextSecondary: "#9ca3af",    // gray-400
                                colorBackground: "#111827",       // gray-900
                                colorInputBackground: "#1f2937",  // gray-800
                                colorInputText: "#f3f4f6",
                                borderRadius: "lg",               // rounded-lg
                                fontFamily: "inherit",            // use your app's font
                            },
                            elements: {
                                rootBox: "mx-auto w-full",
                                card: "bg-gray-900 border border-gray-800 shadow-2xl rounded-xl",
                                headerTitle: "text-2xl font-bold text-white",
                                headerSubtitle: "text-gray-400",
                                navbar: "bg-gray-800 border-b border-gray-700",
                                navbarButton: "text-gray-300 hover:text-white hover:bg-gray-700",
                                formButtonPrimary:
                                    "bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition",
                                formFieldInput:
                                    "bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-indigo-500",
                                socialButtonsBlockButton:
                                    "border border-gray-700 hover:bg-gray-800 text-white",
                                dividerLine: "bg-gray-700",
                                dividerText: "text-gray-500",
                            },
                        }}
                    />
                </div>
            </main>
        </div>
    );
}