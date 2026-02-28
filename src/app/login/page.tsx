"use client";

import { signIn } from "next-auth/react";
import { Brain, Github } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-black/50 p-6 selection:bg-indigo-500/30">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 text-center shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/5 via-pink-500/5 to-orange-500/5 pointer-events-none" />

                <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-6">
                        <Brain className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 mb-2">
                        Welcome to Prism
                    </h1>
                    <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                        Sign in to connect, monitor, and analyze all your AI tool usage in one beautiful dashboard.
                    </p>

                    <div className="space-y-4">
                        <button
                            onClick={() => signIn("google", { callbackUrl: "/" })}
                            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-3.5 px-6 rounded-xl hover:bg-gray-100 transition-colors shadow-lg shadow-white/5"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                <path d="M1 1h22v22H1z" fill="none" />
                            </svg>
                            Continue with Google
                        </button>

                        <button
                            onClick={() => signIn("github", { callbackUrl: "/" })}
                            className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white font-semibold py-3.5 px-6 rounded-xl border border-white/10 hover:bg-[#2c3136] transition-colors shadow-lg shadow-black/50"
                        >
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </button>
                    </div>

                    <p className="mt-8 text-xs text-gray-500">
                        By signing in, you agree to our Terms of Service and Privacy Policy. Authentication is powered by NextAuth.
                    </p>
                </div>
            </div>
        </div>
    );
}
