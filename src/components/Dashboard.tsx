"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
    Cpu, Activity, Zap, Bot, Code2, ArrowUpRight,
    AlertCircle, ExternalLink, TrendingUp, DollarSign
} from "lucide-react";
import Link from "next/link";
import { useIntegrationData, MOCK_DATA } from "@/hooks/useIntegrationData";
import ToolDetailModal, { ToolId } from "@/components/ToolDetailModal";

const MODEL_COLORS = ["#f97316", "#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const PROVIDER_COLORS: Record<string, string> = {
    Claude: "#d97757",
    ChatGPT: "#10b981",
    Gemini: "#1a73e8",
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
    const integrations = useIntegrationData();
    const [loading, setLoading] = useState(true);
    const [openTool, setOpenTool] = useState<ToolId | null>(null);

    useEffect(() => { setLoading(false); }, []);

    const hasClaudeData = !!integrations.claude;
    const hasGeminiData = !!integrations.gemini;
    const hasOpenAIData = !!integrations.openai;
    const hasGeminiMonitoring = !!integrations.geminiMonitoring;
    const hasRealData = hasClaudeData || hasGeminiData || hasOpenAIData;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] text-indigo-300">
                <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-400">Loading intelligence matrix...</p>
                </motion.div>
            </div>
        );
    }

    // ── Compute combined totals (only Claude has real token data) ───────────────

    const claudeTokens = integrations.claude?.totalTokens ?? 0;
    const claudeInput = integrations.claude?.totalInputTokens ?? 0;
    const claudeOutput = integrations.claude?.totalOutputTokens ?? 0;
    const geminiRequests = integrations.geminiMonitoring?.totalRequests ?? 0;

    const totalTokens = hasClaudeData ? claudeTokens : (hasRealData ? 0 : 2_456_000);
    const totalInput = hasClaudeData ? claudeInput : (hasRealData ? 0 : 1_800_000);
    const totalOutput = hasClaudeData ? claudeOutput : (hasRealData ? 0 : 640_000);
    const estCost = hasClaudeData
        ? (claudeInput * 0.000003 + claudeOutput * 0.000015)
        : (hasRealData ? 0 : 45.2);

    // ── Weekly trend ──────────────────────────────────────────────────────────

    const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const buildTrend = () => {
        if (!hasClaudeData) return MOCK_DATA.weeklyTrend;

        const allDates = new Set<string>();
        integrations.claude?.dailyTrend.slice(-7).forEach(d => allDates.add(d.date));

        const sorted = Array.from(allDates).sort().slice(-7);
        return sorted.map(date => {
            const label = DAY_LABELS[new Date(date + "T00:00:00").getDay()];
            const entry: Record<string, string | number> = { day: label };
            entry.Claude = integrations.claude!.dailyTrend.find(d => d.date === date)?.total ?? 0;
            if (hasGeminiMonitoring) {
                const req = integrations.geminiMonitoring!.dailyTrend.find(d => d.date === date)?.requests ?? 0;
                entry.Gemini = req * 1000;
            }
            return entry;
        });
    };

    const weeklyTrend = buildTrend();

    // ── Model pie data ────────────────────────────────────────────────────────

    const buildModels = () => {
        if (!hasRealData) return MOCK_DATA.models.map(m => ({ ...m, fullName: m.name }));

        // Only Claude has detailed model breakdown data
        const combined: Record<string, number> = {};
        if (hasClaudeData) {
            Object.entries(integrations.claude!.modelBreakdown).forEach(([m, v]) => {
                const short = m.split("-").slice(0, 3).join("-");
                combined[short] = (combined[short] ?? 0) + v.input + v.output;
            });
        }
        if (Object.keys(combined).length === 0) {
            // Gemini/OpenAI connected but no token breakdown — use model list as placeholder
            const geminiModels = integrations.gemini?.models.slice(0, 3).map(m => m.name || m.id.split("/").pop() || m.id) ?? [];
            const openaiModels = integrations.openai?.models.slice(0, 2).map(m => m.id) ?? [];
            [...geminiModels, ...openaiModels].forEach((m, i) => { combined[m] = 100 - i * 15; });
        }
        const total = Object.values(combined).reduce((s, v) => s + v, 0) || 1;
        return Object.entries(combined)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, v]) => ({ name, fullName: name, usage: Math.round((v / total) * 100) }));
    };

    const models = buildModels();

    // ── Active bars in chart ──────────────────────────────────────────────────

    const activeBars = Object.keys(PROVIDER_COLORS).filter(p => {
        if (!hasRealData) return true;
        if (p === "Claude") return hasClaudeData;
        if (p === "ChatGPT") return false; // no daily trend for standard key
        if (p === "Gemini") return hasGeminiMonitoring;
        return false;
    });

    // ── Tool cards config ─────────────────────────────────────────────────────

    const tools: {
        id: ToolId | "gemini-monitoring";
        clickable: ToolId | null;
        name: string; company: string; color: string; icon: string;
        connected: boolean;
        stats: { label: string; value: string }[] | null;
        models: string[];
    }[] = [
            {
                id: "claude", clickable: "claude",
                name: "Claude", company: "Anthropic", color: "#d97757", icon: "🧠",
                connected: hasClaudeData,
                stats: hasClaudeData ? [
                    { label: "Total Tokens", value: claudeTokens.toLocaleString() },
                    { label: "Input", value: `${(claudeInput / 1000).toFixed(1)}k` },
                    { label: "Output", value: `${(claudeOutput / 1000).toFixed(1)}k` },
                ] : null,
                models: hasClaudeData
                    ? Object.keys(integrations.claude!.modelBreakdown).slice(0, 2).map(m => m.split("-").slice(0, 3).join("-"))
                    : ["claude-3.5-sonnet", "claude-3-opus"],
            },
            {
                id: "openai", clickable: "openai",
                name: "ChatGPT", company: "OpenAI", color: "#10b981", icon: "💬",
                connected: hasOpenAIData,
                stats: hasOpenAIData ? [
                    { label: "Models", value: `${integrations.openai!.totalModelsAvailable}` },
                    { label: "Tier", value: integrations.openai!.tier },
                    { label: "Key", value: "✓ Valid" },
                ] : null,
                models: hasOpenAIData
                    ? integrations.openai!.models.slice(0, 3).map(m => m.id)
                    : ["gpt-4o", "gpt-4-turbo"],
            },
            {
                id: "gemini", clickable: "gemini",
                name: "Gemini", company: "Google AI", color: "#1a73e8", icon: "✨",
                connected: hasGeminiData,
                stats: hasGeminiMonitoring ? [
                    { label: "API Requests", value: geminiRequests.toLocaleString() },
                    { label: "Est. Tokens", value: `~${(geminiRequests * 1000 / 1000).toFixed(0)}k` },
                    { label: "Models", value: `${integrations.gemini?.totalModelsAvailable ?? 0}` },
                ] : hasGeminiData ? [
                    { label: "Models", value: `${integrations.gemini!.totalModelsAvailable}` },
                    { label: "Key", value: "✓ Valid" },
                    { label: "Monitoring", value: "—" },
                ] : null,
                models: hasGeminiData
                    ? integrations.gemini!.models.slice(0, 2).map(m => m.name || m.id.split("/").pop() || m.id)
                    : ["gemini-1.5-pro", "gemini-1.5-flash"],
            },
        ];

    return (
        <>
            {/* ── Tool Detail Modal ── */}
            <ToolDetailModal
                toolId={openTool}
                onClose={() => setOpenTool(null)}
                claudeData={integrations.claude}
                geminiData={integrations.gemini}
                geminiMonitoringData={integrations.geminiMonitoring}
                openaiData={integrations.openai}
            />

            <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">

                {/* ── Header ── */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-pink-400 to-orange-400">
                            Prism
                        </h1>
                        <p className="text-gray-400 mt-2 text-sm">Your AI usage, unified in one view</p>
                    </div>

                    {hasRealData ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-900/30 border border-green-500/30 w-fit">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </div>
                            <span className="text-sm font-medium text-green-400">Live Data</span>
                        </div>
                    ) : (
                        <Link href="/connect">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-900/40 border border-indigo-500/40 cursor-pointer hover:bg-indigo-900/60 transition-colors w-fit">
                                <AlertCircle className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm font-medium text-indigo-300">Sample Data — Connect Tools</span>
                                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                        </Link>
                    )}
                </motion.div>

                {/* ── Overview Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                        { icon: <Cpu className="w-4.5 h-4.5 text-blue-400" />, title: "Total Tokens", value: totalTokens.toLocaleString(), sub: "All providers (30d)", isReal: hasRealData, delay: 0.1 },
                        { icon: <TrendingUp className="w-4.5 h-4.5 text-orange-400" />, title: "Input Tokens", value: totalInput.toLocaleString(), sub: "Prompts sent", isReal: hasRealData, delay: 0.15 },
                        { icon: <Activity className="w-4.5 h-4.5 text-purple-400" />, title: "Output Tokens", value: totalOutput.toLocaleString(), sub: "Tokens generated", isReal: hasRealData, delay: 0.2 },
                        { icon: <DollarSign className="w-4.5 h-4.5 text-yellow-400" />, title: "Est. Cost", value: `$${estCost.toFixed(2)}`, sub: "Blended 30d cost", isReal: hasRealData, delay: 0.25 },
                    ].map(p => <StatCard key={p.title} {...p} />)}
                </div>

                {/* ── Charts ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Bar chart */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:col-span-2 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                        <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-400" />
                            7-Day Token Activity
                        </h2>
                        <p className="text-xs text-gray-500 mb-5">
                            {hasRealData ? "Real usage across connected providers" : "Sample data — connect tools for live values"}
                        </p>
                        <div className="h-64 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyTrend} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
                                    <XAxis dataKey="day" stroke="#ffffff60" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#ffffff60" fontSize={11} tickLine={false} axisLine={false}
                                        tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                    <Tooltip
                                        cursor={{ fill: "#ffffff08" }}
                                        contentStyle={{ backgroundColor: "#111827f0", borderColor: "#ffffff20", borderRadius: "12px" }}
                                        itemStyle={{ color: "#fff" }}
                                        formatter={(v: number | undefined) => (v ?? 0).toLocaleString()}
                                    />
                                    {activeBars.map((provider, i) => (
                                        <Bar key={provider} dataKey={provider} stackId="a"
                                            fill={PROVIDER_COLORS[provider]}
                                            radius={i === activeBars.length - 1 ? [4, 4, 0, 0] : i === 0 ? [0, 0, 4, 4] : undefined}
                                        />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-4 mt-3 relative z-10">
                            {activeBars.map(p => (
                                <div key={p} className="flex items-center gap-1.5 text-xs text-gray-400">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PROVIDER_COLORS[p] }} />
                                    {p}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Pie chart */}
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden"
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none rounded-b-2xl" />
                        <h2 className="text-base font-semibold mb-1 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-blue-400" /> LLM Mix
                        </h2>
                        <p className="text-xs text-gray-500 mb-4">
                            {hasRealData ? "Combined model token share" : "Sample distribution"}
                        </p>
                        <div className="h-48 w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={models} cx="50%" cy="50%" innerRadius={50} outerRadius={70}
                                        paddingAngle={4} dataKey="usage" stroke="none"
                                        label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {models.map((_, idx) => (
                                            <Cell key={idx} fill={MODEL_COLORS[idx % MODEL_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#111827f0", borderColor: "#ffffff20", borderRadius: "12px" }}
                                        itemStyle={{ color: "#fff" }}
                                        formatter={(v: number | undefined) => `${v ?? 0}%`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-1.5 mt-3 relative z-10">
                            {models.slice(0, 4).map((m, idx) => (
                                <div key={m.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 truncate">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MODEL_COLORS[idx % MODEL_COLORS.length] }} />
                                        <span className="text-gray-300 truncate font-mono">{m.name}</span>
                                    </div>
                                    <span className="text-gray-400 ml-2 shrink-0">{m.usage}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* ── Integrations List ── */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                            <Code2 className="w-4 h-4 text-teal-400" /> Integrations
                        </h2>
                        <Link href="/connect" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                            Manage <ArrowUpRight className="w-3 h-3" />
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {tools.map((tool, idx) => (
                            <motion.div
                                key={tool.id}
                                initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.65 + idx * 0.08 }}
                                onClick={() => tool.clickable && setOpenTool(tool.clickable as ToolId)}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${tool.clickable ? "cursor-pointer hover:bg-white/8 hover:border-white/15" : ""
                                    }`}
                                style={{
                                    backgroundColor: tool.connected ? `${tool.color}0d` : "rgba(255,255,255,0.03)",
                                    borderColor: tool.connected ? `${tool.color}28` : "rgba(255,255,255,0.06)",
                                }}
                            >
                                <div className="flex items-center gap-4 mb-3 sm:mb-0">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                                        style={{ background: `${tool.color}20`, border: `1px solid ${tool.color}35` }}>
                                        {tool.icon}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{tool.name}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tool.connected
                                                ? "bg-green-900/40 text-green-300 border-green-700/50"
                                                : "bg-gray-800/60 text-gray-500 border-gray-700/50"
                                                }`}>
                                                {tool.connected ? "● Connected" : "○ Not Connected"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{tool.company}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {tool.models.slice(0, 3).map(m => (
                                                <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono">{m}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {tool.stats ? (
                                        <div className="flex gap-6 sm:gap-8">
                                            {tool.stats.map(s => (
                                                <div key={s.label} className="text-right">
                                                    <p className="text-xs text-gray-500">{s.label}</p>
                                                    <p className="font-mono text-sm font-semibold mt-0.5" style={{ color: tool.color }}>{s.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <Link href="/connect" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                                Connect <ArrowUpRight className="w-3 h-3" />
                                            </div>
                                        </Link>
                                    )}
                                    {tool.clickable && (
                                        <div className="hidden sm:flex items-center text-xs text-gray-600 hover:text-gray-400 gap-1 transition-colors">
                                            Details <ArrowUpRight className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Zap stat at bottom ── */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    className="flex items-center gap-2 text-xs text-gray-600 justify-center pb-2"
                >
                    <Zap className="w-3 h-3" />
                    Click any connected tool to view full usage details
                </motion.div>

            </div>
        </>
    );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, title, value, sub, isReal, delay }: {
    icon: React.ReactNode; title: string; value: string; sub: string; isReal: boolean; delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/8 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">{icon}</div>
                {isReal && <span className="text-xs text-green-400 bg-green-900/30 border border-green-700/40 px-2 py-0.5 rounded-full">Live</span>}
            </div>
            <h3 className="text-gray-400 text-xs font-medium mb-1">{title}</h3>
            <p className="text-2xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{value}</p>
            <p className="text-xs text-gray-600 mt-1.5">{sub}</p>
        </motion.div>
    );
}
