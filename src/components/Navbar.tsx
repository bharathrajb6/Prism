"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Plug, Brain, LogOut, LogIn, Sun, Moon } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";


const NAV_LINKS = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/connect", label: "Connect Tools", icon: Plug },
];

function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />;

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
            title="Toggle theme"
        >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
    );
}

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/30 border-b border-gray-900/10 dark:border-white/10 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                        <Brain className="w-4 h-4 text-gray-900 dark:text-white" />
                    </div>
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400 tracking-tight">
                        Prism
                    </span>
                </Link>

                {/* Nav Links */}
                <div className="flex items-center gap-2">
                    {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${active
                                    ? "bg-gray-900/10 dark:bg-white/10 text-gray-900 dark:text-white border border-gray-900/20 dark:border-white/20"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-white hover:bg-gray-900/5 dark:bg-white/5"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        );
                    })}

                    <div className="w-px h-6 bg-gray-900/10 dark:bg-white/10 mx-2" />

                    <ThemeToggle />

                    <div className="w-px h-6 bg-gray-900/10 dark:bg-white/10 mx-2" />

                    {status === "loading" ? (
                        <div className="w-8 h-8 rounded-full bg-gray-900/10 dark:bg-white/10 animate-pulse" />
                    ) : session?.user ? (
                        <div className="flex items-center gap-3 pl-2">
                            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {session.user.name?.split(" ")[0]}
                            </span>
                            {session.user.image ? (
                                <img src={session.user.image} alt={session.user.name || "User"} className="w-8 h-8 rounded-full border border-gray-900/20 dark:border-white/20" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-orange-400 flex items-center justify-center text-sm font-bold border border-gray-900/20 dark:border-white/20">
                                    {session.user.name?.charAt(0) || "U"}
                                </div>
                            )}
                            <button
                                onClick={() => signOut()}
                                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:text-red-400 hover:bg-gray-900/5 dark:bg-white/5 rounded-xl transition-all ml-1"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-colors ml-2 shadow-lg shadow-black/5 dark:shadow-white/5"
                        >
                            <LogIn className="w-4 h-4" />
                            Sign in
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
