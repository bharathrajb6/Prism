"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Plug, Brain } from "lucide-react";

const NAV_LINKS = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/connect", label: "Connect Tools", icon: Plug },
];

export default function Navbar() {
    const pathname = usePathname();

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
                </div>
            </div>
        </nav>
    );
}
