"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, TrendingUp, Cpu, Activity, DollarSign, Bot,
    BarChart3, Layers, ArrowUpRight, AlertTriangle
} from "lucide-react";
import {
    ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
    CartesianGrid, XAxis, YAxis, Tooltip
} from "recharts";
import Link from "next/link";

import { ClaudeData, GeminiData, GeminiMonitoringData, OpenAIData } from "@/hooks/useIntegrationData";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ToolId = "claude" | "gemini" | "openai";

export interface ToolDetailProps {
    toolId: ToolId | null;
    onClose: () => void;
    claudeData: ClaudeData | null;
    geminiData: GeminiData | null;
    geminiMonitoringData: GeminiMonitoringData | null;
    openaiData: OpenAIData | null;
}

const MODEL_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const TOOL_META: Record<ToolId, {
    name: string; company: string; color: string; bg: string; emoji: string; description: string;
}> = {
    claude: {
        name: "Claude", company: "Anthropic", color: "#d97757",
        bg: "from-orange-900/30 to-red-900/20", emoji: "🧠",
        description: "Anthropic's Claude is a safety-focused family of AI assistants known for nuanced reasoning, long context windows (up to 200k tokens), and strong code generation.",
    },
    gemini: {
        name: "Gemini", company: "Google AI", color: "#1a73e8",
        bg: "from-blue-900/30 to-indigo-900/20", emoji: "✨",
        description: "Google's Gemini is a multimodal AI model available via AI Studio and Vertex AI, offering one of the largest context windows (2M tokens) in the industry.",
    },
    openai: {
        name: "ChatGPT", company: "OpenAI", color: "#10b981",
        bg: "from-emerald-900/30 to-teal-900/20", emoji: "💬",
        description: "OpenAI's GPT-4 family powers ChatGPT and the API. Known for broad general capability, function calling, vision support, and an extensive tool/plugin ecosystem.",
    },
};

// ─── Modal Root ────────────────────────────────────────────────────────────────

export default function ToolDetailModal({
    toolId, onClose, claudeData, geminiData, geminiMonitoringData, openaiData
}: ToolDetailProps) {
    const [tab, setTab] = useState<"overview" | "usage" | "models">("overview");

    return (
        <AnimatePresence>
            {toolId && (
                <>
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        key="panel"
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 280 }}
                        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl flex flex-col"
                        style={{ background: "linear-gradient(160deg, #0d0d1f 0%, #111827 100%)", borderLeft: "1px solid rgba(255,255,255,0.1)" }}
                    >
                        {/* Header */}
                        <div className={`p-6 bg-gradient-to-r ${TOOL_META[toolId].bg} border-b border-white/10`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-xl"
                                        style={{ background: `${TOOL_META[toolId].color}25`, border: `1px solid ${TOOL_META[toolId].color}50` }}
                                    >
                                        {TOOL_META[toolId].emoji}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold">{TOOL_META[toolId].name}</h2>
                                        <p className="text-sm text-gray-400">{TOOL_META[toolId].company}</p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10">
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>
                            <p className="mt-4 text-sm text-gray-400 leading-relaxed">{TOOL_META[toolId].description}</p>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-white/10 px-6">
                            {(["overview", "usage", "models"] as const).map(t => (
                                <button key={t} onClick={() => setTab(t)}
                                    className={`relative px-4 py-3 text-sm font-medium transition-colors capitalize ${tab === t ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                                >
                                    {t}
                                    {tab === t && (
                                        <motion.div layoutId="tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                                            style={{ background: TOOL_META[toolId].color }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <AnimatePresence mode="wait">
                                <motion.div key={tab}
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                                >
                                    {tab === "overview" && <OverviewTab toolId={toolId} claudeData={claudeData} geminiData={geminiData} geminiMonitoringData={geminiMonitoringData} openaiData={openaiData} />}
                                    {tab === "usage" && <UsageTab toolId={toolId} claudeData={claudeData} geminiMonitoringData={geminiMonitoringData} openaiData={openaiData} />}
                                    {tab === "models" && <ModelsTab toolId={toolId} claudeData={claudeData} geminiData={geminiData} openaiData={openaiData} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-500">
                            <span>Data sourced from official APIs · Updated on connect</span>
                            <Link href="/connect" onClick={onClose} className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1">
                                Manage connection <ArrowUpRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ─── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ toolId, claudeData, geminiData, geminiMonitoringData, openaiData }: {
    toolId: ToolId; claudeData: ClaudeData | null; geminiData: GeminiData | null;
    geminiMonitoringData: GeminiMonitoringData | null; openaiData: OpenAIData | null;
}) {
    const color = TOOL_META[toolId].color;

    if (toolId === "claude") {
        if (!claudeData) return <NotConnectedMsg tool="Claude" />;
        const { totalTokens, totalInputTokens: inp, totalOutputTokens: out, modelBreakdown, dailyTrend } = claudeData;
        const estCost = (inp * 0.000003 + out * 0.000015).toFixed(2);
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { icon: <Cpu className="w-4 h-4" />, label: "Total Tokens (30d)", value: totalTokens.toLocaleString(), accent: color },
                        { icon: <TrendingUp className="w-4 h-4" />, label: "Input Tokens", value: inp.toLocaleString(), accent: "#60a5fa" },
                        { icon: <Activity className="w-4 h-4" />, label: "Output Tokens", value: out.toLocaleString(), accent: "#a78bfa" },
                        { icon: <DollarSign className="w-4 h-4" />, label: "Est. API Cost", value: `$${estCost}`, accent: "#4ade80" },
                        { icon: <Bot className="w-4 h-4" />, label: "Models Used", value: `${Object.keys(modelBreakdown).length}`, accent: "#fb923c" },
                        { icon: <BarChart3 className="w-4 h-4" />, label: "Active Days", value: `${dailyTrend.filter(d => d.total > 0).length} / 30`, accent: "#f472b6" },
                    ].map(s => <MiniStatCard key={s.label} {...s} />)}
                </div>
                <RatioBar label="Input" pct={(inp / totalTokens) * 100} color={color} />
                <CostBreakdown rows={[
                    { label: "Input cost (est. $3/M tokens)", value: `$${(inp * 0.000003).toFixed(3)}` },
                    { label: "Output cost (est. $15/M tokens)", value: `$${(out * 0.000015).toFixed(3)}` },
                    { label: "Total estimated", value: `$${estCost}`, bold: true },
                ]} />
            </div>
        );
    }

    if (toolId === "openai") {
        if (!openaiData) return <NotConnectedMsg tool="ChatGPT" />;
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { icon: <Bot className="w-4 h-4" />, label: "Models Accessible", value: `${openaiData.totalModelsAvailable}`, accent: color },
                        { icon: <Activity className="w-4 h-4" />, label: "Account Tier", value: openaiData.tier, accent: "#60a5fa" },
                        { icon: <Cpu className="w-4 h-4" />, label: "Key Valid", value: openaiData.keyValid ? "✓ Yes" : "✗ No", accent: "#4ade80" },
                        { icon: <BarChart3 className="w-4 h-4" />, label: "Newest Model", value: openaiData.models[0]?.id.split("-").slice(0, 3).join("-") ?? "—", accent: "#fb923c" },
                    ].map(s => <MiniStatCard key={s.label} {...s} />)}
                </div>
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-300">Top GPT Models</h3>
                    <div className="space-y-2">
                        {openaiData.models.slice(0, 5).map((m, i) => (
                            <div key={m.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                                    <span className="font-mono text-sm text-emerald-300 truncate">{m.id}</span>
                                </div>
                                <span className="text-xs text-gray-500 ml-2 shrink-0">{m.created}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {openaiData.usageNote && (
                    <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-300">
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Usage history not available</p>
                            <p className="text-yellow-400/70 text-xs">{openaiData.usageNote}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Gemini
    return (
        <div className="space-y-5">
            {geminiData ? (
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { icon: <Bot className="w-4 h-4" />, label: "Models Available", value: `${geminiData.totalModelsAvailable}`, accent: color },
                        { icon: <Cpu className="w-4 h-4" />, label: "Max Context", value: "2M tokens", accent: "#60a5fa" },
                        { icon: <Activity className="w-4 h-4" />, label: "API Requests (30d)", value: geminiMonitoringData ? geminiMonitoringData.totalRequests.toLocaleString() : "—", accent: "#4ade80" },
                        { icon: <BarChart3 className="w-4 h-4" />, label: "Est. Tokens", value: geminiMonitoringData ? `~${(geminiMonitoringData.totalRequests).toFixed(0)}k` : "—", accent: "#a78bfa" },
                    ].map(s => <MiniStatCard key={s.label} {...s} />)}
                </div>
            ) : <NotConnectedMsg tool="Gemini" />}

            {!geminiMonitoringData && geminiData && (
                <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/20 rounded-2xl p-4 text-sm text-yellow-300">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold mb-1">Historical usage not available</p>
                        <p className="text-yellow-400/70 text-xs">Connect Google Cloud Monitoring on the Connect page for 30-day request history.</p>
                    </div>
                </div>
            )}

            {geminiData && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                    <h3 className="text-sm font-semibold mb-4 text-gray-300">Model Capabilities</h3>
                    <div className="space-y-3">
                        {geminiData.models.slice(0, 5).map(m => (
                            <div key={m.id} className="flex items-center justify-between">
                                <span className="text-sm font-mono text-blue-300 truncate">{m.name || m.id.split("/").pop()}</span>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full" style={{ width: `${Math.min((m.inputTokenLimit / 2000000) * 100, 100)}%`, background: color }} />
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono w-14 text-right">
                                        {m.inputTokenLimit >= 1000000 ? `${(m.inputTokenLimit / 1000000).toFixed(1)}M` : `${(m.inputTokenLimit / 1000).toFixed(0)}k`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Usage Tab ─────────────────────────────────────────────────────────────────

function UsageTab({ toolId, claudeData, geminiMonitoringData, openaiData }: {
    toolId: ToolId; claudeData: ClaudeData | null;
    geminiMonitoringData: GeminiMonitoringData | null; openaiData: OpenAIData | null;
}) {
    const color = TOOL_META[toolId].color;

    if (toolId === "openai") {
        if (!openaiData) return <NotConnectedMsg tool="ChatGPT" />;
        return (
            <div className="space-y-4">
                <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/20 rounded-2xl p-5 text-yellow-300">
                    <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold mb-1">Historical usage not available</p>
                        <p className="text-xs text-yellow-400/70 leading-relaxed">
                            The standard OpenAI API key does not provide access to token usage history.
                            Daily request and token data requires an Admin API key from your OpenAI organisation settings.
                        </p>
                    </div>
                </div>
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                    <p className="text-sm text-gray-300 font-semibold mb-1">What we can show</p>
                    <p className="text-xs text-gray-500">With your standard key we validate connectivity and enumerate all accessible models. Connect an Admin key to unlock 30-day token trends.</p>
                </div>
            </div>
        );
    }

    if (toolId === "claude") {
        if (!claudeData || claudeData.dailyTrend.length === 0) return <NotConnectedMsg tool="Claude" />;
        const trend = claudeData.dailyTrend;
        const peak = trend.reduce((max: { date: string; total: number }, d: { date: string; total: number }) => d.total > max.total ? d : max, trend[0]);
        const gradId = "grad_claude";
        return (
            <div className="space-y-6">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                    <h3 className="text-sm font-semibold mb-1 text-gray-300">30-Day Token Usage</h3>
                    <p className="text-xs text-gray-500 mb-5">Input vs Output tokens per day</p>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={`${gradId}_in`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id={`${gradId}_out`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                                <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false}
                                    tickFormatter={(v: string) => v.slice(5)} interval={Math.floor(trend.length / 6)} />
                                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false}
                                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                                <Tooltip contentStyle={{ backgroundColor: "#111827f0", borderColor: "#ffffff20", borderRadius: "10px" }}
                                    itemStyle={{ color: "#fff" }} formatter={(v: number | undefined) => (v ?? 0).toLocaleString()} />
                                <Area type="monotone" dataKey="input" stackId="1" stroke={color} strokeWidth={2} fill={`url(#${gradId}_in)`} name="Input" />
                                <Area type="monotone" dataKey="output" stackId="1" stroke="#a78bfa" strokeWidth={2} fill={`url(#${gradId}_out)`} name="Output" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                        <p className="text-gray-500 text-xs mb-1">Peak Day</p>
                        <p className="font-mono font-bold text-white">{peak.date}</p>
                        <p className="font-mono text-xs mt-1" style={{ color }}>{peak.total.toLocaleString()} tokens</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                        <p className="text-gray-500 text-xs mb-1">Daily Average</p>
                        <p className="font-mono font-bold text-white">
                            {Math.round(claudeData.totalTokens / Math.max(trend.filter((d: { total: number }) => d.total > 0).length, 1)).toLocaleString()}
                        </p>
                        <p className="font-mono text-xs mt-1 text-gray-400">tokens / active day</p>
                    </div>
                </div>
            </div>
        );
    }

    // Gemini
    if (!geminiMonitoringData) {
        return (
            <div className="flex items-start gap-3 bg-yellow-900/20 border border-yellow-500/20 rounded-2xl p-5 text-yellow-300">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                    <p className="font-semibold mb-1">Cloud Monitoring not connected</p>
                    <p className="text-xs text-yellow-400/70 leading-relaxed">Connect Google Cloud Monitoring with a service account to see 30-day API request history.</p>
                </div>
            </div>
        );
    }
    const trend = geminiMonitoringData.dailyTrend;
    const peak = trend.length ? trend.reduce((max, d) => d.requests > max.requests ? d : max, trend[0]) : null;
    return (
        <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold mb-1 text-gray-300">30-Day API Requests</h3>
                <p className="text-xs text-gray-500 mb-5">Daily request counts via Cloud Monitoring</p>
                <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gemini_grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                            <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false}
                                tickFormatter={(v: string) => v.slice(5)} interval={Math.floor(trend.length / 6)} />
                            <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#111827f0", borderColor: "#ffffff20", borderRadius: "10px" }}
                                itemStyle={{ color: "#fff" }} formatter={(v: number | undefined) => [`${v ?? 0} requests`, "Requests"]} />
                            <Area type="monotone" dataKey="requests" stroke={color} strokeWidth={2} fill="url(#gemini_grad)" name="Requests" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                    <p className="text-gray-500 text-xs mb-1">Peak Day</p>
                    <p className="font-mono font-bold text-white">{peak?.date ?? "—"}</p>
                    <p className="font-mono text-xs mt-1" style={{ color }}>{peak?.requests ?? 0} requests</p>
                </div>
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4">
                    <p className="text-gray-500 text-xs mb-1">Total (30d)</p>
                    <p className="font-mono font-bold text-white">{geminiMonitoringData.totalRequests.toLocaleString()}</p>
                    <p className="font-mono text-xs mt-1 text-gray-400">~{geminiMonitoringData.totalRequests}k est. tokens</p>
                </div>
            </div>
        </div>
    );
}

// ─── Models Tab ────────────────────────────────────────────────────────────────

function ModelsTab({ toolId, claudeData, geminiData, openaiData }: {
    toolId: ToolId; claudeData: ClaudeData | null; geminiData: GeminiData | null; openaiData: OpenAIData | null;
}) {
    if (toolId === "openai") {
        if (!openaiData) return <NotConnectedMsg tool="ChatGPT" />;
        return (
            <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                <h3 className="text-sm font-semibold mb-1 text-gray-300">Accessible OpenAI Models</h3>
                <p className="text-xs text-gray-500 mb-4">{openaiData.totalModelsAvailable} GPT / o-series models available with your key</p>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {openaiData.models.map((m, idx) => (
                        <div key={m.id} className="border border-white/8 rounded-xl px-4 py-3 flex items-center justify-between hover:border-white/15 hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MODEL_COLORS[idx % MODEL_COLORS.length] }} />
                                <span className="font-mono text-sm text-emerald-300 truncate">{m.id}</span>
                            </div>
                            <span className="text-xs text-gray-500 font-mono ml-2 shrink-0">{m.created}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (toolId === "claude") {
        if (!claudeData) return <NotConnectedMsg tool="Claude" />;
        const color = TOOL_META.claude.color;
        type BreakdownEntry = { input: number; output: number };
        const entries = (Object.entries(claudeData.modelBreakdown) as [string, BreakdownEntry][])
            .sort((a, b) => (b[1].input + b[1].output) - (a[1].input + a[1].output));
        const totalUsage = entries.reduce((s, [, v]) => s + v.input + v.output, 0) || 1;
        const pieData = entries.map(([name, v]) => ({ name, value: v.input + v.output }));

        return (
            <div className="space-y-5">
                {entries.length === 0 ? <p className="text-gray-500 text-sm">No model breakdown data yet.</p> : (
                    <>
                        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
                            <h3 className="text-sm font-semibold mb-4 text-gray-300">Token Distribution by Model</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75}
                                            paddingAngle={4} dataKey="value" stroke="none"
                                            label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}
                                        >
                                            {pieData.map((_, idx) => <Cell key={idx} fill={MODEL_COLORS[idx % MODEL_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: "#111827f0", borderColor: "#ffffff20", borderRadius: "10px" }}
                                            formatter={(v: number | undefined) => (v ?? 0).toLocaleString()} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 grid grid-cols-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <span className="col-span-2">Model</span>
                                <span className="text-right">Tokens</span>
                                <span className="text-right">Share</span>
                            </div>
                            {entries.map(([model, usage], idx) => {
                                const total = usage.input + usage.output;
                                return (
                                    <div key={model} className="px-4 py-3 grid grid-cols-4 items-center border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <div className="col-span-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: MODEL_COLORS[idx % MODEL_COLORS.length] }} />
                                            <span className="font-mono text-xs text-gray-200 truncate">{model}</span>
                                        </div>
                                        <span className="text-right font-mono text-xs text-gray-300">{total.toLocaleString()}</span>
                                        <span className="text-right font-mono text-xs" style={{ color }}>
                                            {((total / totalUsage) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Gemini
    if (!geminiData) return <NotConnectedMsg tool="Gemini" />;
    const color = TOOL_META.gemini.color;
    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold mb-1 text-gray-300">Available Gemini Models</h3>
            <p className="text-xs text-gray-500 mb-4">{geminiData.totalModelsAvailable} models accessible with your key</p>
            <div className="space-y-3">
                {geminiData.models.map((m, idx) => {
                    const ctxLabel = m.inputTokenLimit >= 1000000 ? `${(m.inputTokenLimit / 1000000).toFixed(1)}M` : `${(m.inputTokenLimit / 1000).toFixed(0)}k`;
                    return (
                        <div key={m.id} className="border border-white/8 rounded-xl p-4 hover:border-white/15 hover:bg-white/5 transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[idx % MODEL_COLORS.length] }} />
                                    <span className="font-medium text-sm text-blue-200">{m.name || m.id.split("/").pop()}</span>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">{ctxLabel} ctx</span>
                            </div>
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((m.inputTokenLimit / 2000000) * 100, 100)}%` }}
                                    transition={{ delay: idx * 0.05, duration: 0.5, ease: "easeOut" }}
                                    className="h-full rounded-full" style={{ backgroundColor: color }} />
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5 font-mono truncate">{m.id}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function MiniStatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors">
            <div className="flex items-center gap-2 mb-2" style={{ color: accent }}>{icon}</div>
            <p className="text-gray-500 text-xs mb-1">{label}</p>
            <p className="font-mono font-bold text-white text-lg leading-tight">{value}</p>
        </div>
    );
}

function RatioBar({ label, pct, color }: { label: string; pct: number; color: string }) {
    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold mb-4 text-gray-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gray-400" /> Input / Output Token Ratio
            </h3>
            {[{ l: label, p: pct, c: color }, { l: "Output", p: 100 - pct, c: "#a78bfa" }].map(row => (
                <div key={row.l} className="mb-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{row.l}</span><span>{row.p.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${row.p}%`, background: row.c }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CostBreakdown({ rows }: { rows: { label: string; value: string; bold?: boolean }[] }) {
    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-5">
            <h3 className="text-sm font-semibold mb-4 text-gray-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" /> Cost Estimate Breakdown
            </h3>
            <div className="space-y-2 text-sm">
                {rows.map(row => (
                    <div key={row.label} className={`flex justify-between ${row.bold ? "border-t border-white/10 pt-2 font-semibold text-white" : "text-gray-400"}`}>
                        <span>{row.label}</span>
                        <span className={row.bold ? "text-green-400 font-mono" : "font-mono"}>{row.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NotConnectedMsg({ tool }: { tool: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl mb-4">🔌</div>
            <h3 className="font-semibold text-white mb-2">{tool} Not Connected</h3>
            <p className="text-gray-500 text-sm max-w-xs mb-5">Connect your {tool} API key to unlock real-time usage, model breakdowns, and cost estimates.</p>
            <Link href="/connect" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/10 hover:bg-white/15 border border-white/10 transition-colors">
                Go to Connect <ArrowUpRight className="w-4 h-4" />
            </Link>
        </div>
    );
}
