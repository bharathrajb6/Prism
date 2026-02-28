"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Plug, Brain, LogOut, LogIn } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";

const NAV_LINKS = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/connect", label: "Connect Tools", icon: Plug },
];

export default function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    return (
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 px-6 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
                        <Brain className="w-4 h-4 text-white" />
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
                                    ? "bg-white/10 text-white border border-white/20"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        );
                    })}

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    {status === "loading" ? (
                        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
                    ) : session?.user ? (
                        <div className="flex items-center gap-3 pl-2">
                            <span className="hidden sm:block text-sm font-medium text-gray-300">
                                {session.user.name?.split(" ")[0]}
                            </span>
                            {session.user.image ? (
                                <img src={session.user.image} alt={session.user.name || "User"} className="w-8 h-8 rounded-full border border-white/20" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-500 to-orange-400 flex items-center justify-center text-sm font-bold border border-white/20">
                                    {session.user.name?.charAt(0) || "U"}
                                </div>
                            )}
                            <button
                                onClick={() => signOut()}
                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-all ml-1"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn()}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white text-black hover:bg-gray-200 transition-colors ml-2 shadow-lg shadow-white/5"
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
