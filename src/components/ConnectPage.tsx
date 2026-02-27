"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Key, Check, X, Loader2, ExternalLink, AlertTriangle,
    ChevronRight, Eye, EyeOff, Cloud, FileJson, Unplug
} from "lucide-react";
import { persistIntegration, disconnectTool } from "@/hooks/useIntegrationData";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectStatus = "idle" | "loading" | "success" | "error";

interface IntegrationResult {
    status: ConnectStatus;
    data?: Record<string, unknown>;
    error?: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConnectPage() {
    // API keys
    const [claudeKey, setClaudeKey] = useState("");
    const [geminiKey, setGeminiKey] = useState("");
    const [openaiKey, setOpenaiKey] = useState("");
    const [gcpProjectId, setGcpProjectId] = useState("");
    const [serviceAccountJson, setServiceAccountJson] = useState("");

    // Show / hide secrets
    const [show, setShow] = useState({ claude: false, gemini: false, openai: false });

    // Parse existing localStorage state → pre-mark already-connected tools
    const [states, setStates] = useState<Record<string, IntegrationResult>>(() => {
        if (typeof window === "undefined") return {
            claude: { status: "idle" },
            openai: { status: "idle" },
            gemini: { status: "idle" },
            "gemini-monitoring": { status: "idle" },
        };
        const tryRead = (key: string) => {
            try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
        };
        return {
            claude: tryRead("prism_claude_data") ? { status: "success", data: tryRead("prism_claude_data") } : { status: "idle" },
            openai: tryRead("prism_openai_data") ? { status: "success", data: tryRead("prism_openai_data") } : { status: "idle" },
            gemini: tryRead("prism_gemini_data") ? { status: "success", data: tryRead("prism_gemini_data") } : { status: "idle" },
            "gemini-monitoring": tryRead("prism_gemini-monitoring_data") ? { status: "success", data: tryRead("prism_gemini-monitoring_data") } : { status: "idle" },
        };
    });

    // Re-sync if another tab connects/disconnects
    useEffect(() => {
        const onChanged = () => {
            const tryRead = (key: string) => {
                try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch { return null; }
            };
            setStates(prev => ({
                ...prev,
                claude: tryRead("prism_claude_data") ? { status: "success", data: tryRead("prism_claude_data") } : (prev.claude.status === "success" ? { status: "idle" } : prev.claude),
                openai: tryRead("prism_openai_data") ? { status: "success", data: tryRead("prism_openai_data") } : (prev.openai.status === "success" ? { status: "idle" } : prev.openai),
                gemini: tryRead("prism_gemini_data") ? { status: "success", data: tryRead("prism_gemini_data") } : (prev.gemini.status === "success" ? { status: "idle" } : prev.gemini),
                "gemini-monitoring": tryRead("prism_gemini-monitoring_data") ? { status: "success", data: tryRead("prism_gemini-monitoring_data") } : (prev["gemini-monitoring"].status === "success" ? { status: "idle" } : prev["gemini-monitoring"]),
            }));
        };
        window.addEventListener("prism-storage-changed", onChanged);
        window.addEventListener("storage", onChanged);
        return () => {
            window.removeEventListener("prism-storage-changed", onChanged);
            window.removeEventListener("storage", onChanged);
        };
    }, []);

    const setStatus = (id: string, result: IntegrationResult) =>
        setStates(prev => ({ ...prev, [id]: result }));

    // ── Connect handlers ─────────────────────────────────────────────────────

    const connectClaude = useCallback(async () => {
        if (!claudeKey.trim()) return;
        setStatus("claude", { status: "loading" });
        try {
            const res = await fetch("/api/integrations/claude", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ adminKey: claudeKey.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setStatus("claude", { status: "error", error: data.error }); return; }
            setStatus("claude", { status: "success", data });
            persistIntegration("claude", data);
        } catch {
            setStatus("claude", { status: "error", error: "Network error — check your connection." });
        }
    }, [claudeKey]);

    const connectGemini = useCallback(async () => {
        if (!geminiKey.trim()) return;
        setStatus("gemini", { status: "loading" });
        try {
            const res = await fetch("/api/integrations/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: geminiKey.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setStatus("gemini", { status: "error", error: data.error }); return; }
            setStatus("gemini", { status: "success", data });
            persistIntegration("gemini", data);
        } catch {
            setStatus("gemini", { status: "error", error: "Network error — check your connection." });
        }
    }, [geminiKey]);

    const connectGeminiMonitoring = useCallback(async () => {
        if (!gcpProjectId.trim() || !serviceAccountJson.trim()) return;
        setStatus("gemini-monitoring", { status: "loading" });
        try {
            const res = await fetch("/api/integrations/gemini-monitoring", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId: gcpProjectId.trim(),
                    serviceAccountJson: serviceAccountJson.trim(),
                }),
            });
            const data = await res.json();
            if (!res.ok) { setStatus("gemini-monitoring", { status: "error", error: data.error }); return; }
            setStatus("gemini-monitoring", { status: "success", data });
            persistIntegration("gemini-monitoring", data);
        } catch {
            setStatus("gemini-monitoring", { status: "error", error: "Network error — check your connection." });
        }
    }, [gcpProjectId, serviceAccountJson]);

    const connectOpenAI = useCallback(async () => {
        if (!openaiKey.trim()) return;
        setStatus("openai", { status: "loading" });
        try {
            const res = await fetch("/api/integrations/openai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ apiKey: openaiKey.trim() }),
            });
            const data = await res.json();
            if (!res.ok) { setStatus("openai", { status: "error", error: data.error }); return; }
            setStatus("openai", { status: "success", data });
            persistIntegration("openai", data);
        } catch {
            setStatus("openai", { status: "error", error: "Network error — check your connection." });
        }
    }, [openaiKey]);

    // ── Disconnect handlers ────────────────────────────────────────────────────
    const handleDisconnect = (tool: "claude" | "gemini" | "geminiMonitoring" | "openai", stateId: string) => {
        disconnectTool(tool);
        setStatus(stateId, { status: "idle" });
    };

    return (
        <div className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                    Connect Your AI Tools
                </h1>
                <p className="text-gray-400 text-sm">
                    Paste your API keys below. They are sent only to your own backend and stored in your browser&apos;s localStorage.
                </p>
            </motion.div>

            <div className="space-y-6">

                {/* ── Claude ─────────────────────────────────────────────────────── */}
                <IntegrationCard
                    icon="🧠" name="Claude" company="Anthropic"
                    gradientFrom="#7c2d12" gradientTo="#ea580c"
                    status={states.claude.status}
                    description="Requires an Admin API key to access the full Usage Report API with 30-day token history."
                    docUrl="https://console.anthropic.com/settings/admin-keys"
                    docLabel="Create Admin Key in Console →"
                    onDisconnect={states.claude.status === "success" ? () => handleDisconnect("claude", "claude") : undefined}
                >
                    {states.claude.status !== "success" && (
                        <div className="space-y-3">
                            <SecretInput
                                label="Admin API Key"
                                placeholder="sk-ant-admin01-..."
                                value={claudeKey}
                                onChange={setClaudeKey}
                                visible={show.claude}
                                onToggle={() => setShow(s => ({ ...s, claude: !s.claude }))}
                                disabled={states.claude.status === "loading"}
                            />
                            <ConnectButton
                                status={states.claude.status}
                                disabled={!claudeKey.trim()}
                                onClick={connectClaude}
                                gradient="linear-gradient(135deg, #7c2d12, #ea580c)"
                            />
                        </div>
                    )}
                    <FeedbackPanel state={states.claude} />
                    {states.claude.status === "success" && states.claude.data && (
                        <ClaudeResult data={states.claude.data} />
                    )}
                </IntegrationCard>

                {/* ── ChatGPT / OpenAI ────────────────────────────────────────────── */}
                <IntegrationCard
                    icon="💬" name="ChatGPT" company="OpenAI"
                    gradientFrom="#064e3b" gradientTo="#10b981"
                    status={states.openai.status}
                    description="Your standard OpenAI API key (sk-...). Validates connectivity and lists all GPT/o1/o3 models accessible with your account."
                    docUrl="https://platform.openai.com/api-keys"
                    docLabel="Get your API key from OpenAI Platform →"
                    onDisconnect={states.openai.status === "success" ? () => handleDisconnect("openai", "openai") : undefined}
                >
                    {states.openai.status !== "success" && (
                        <div className="space-y-3">
                            <SecretInput
                                label="API Key"
                                placeholder="sk-..."
                                value={openaiKey}
                                onChange={setOpenaiKey}
                                visible={show.openai}
                                onToggle={() => setShow(s => ({ ...s, openai: !s.openai }))}
                                disabled={states.openai.status === "loading"}
                            />
                            <ConnectButton
                                status={states.openai.status}
                                disabled={!openaiKey.trim()}
                                onClick={connectOpenAI}
                                gradient="linear-gradient(135deg, #064e3b, #10b981)"
                            />
                        </div>
                    )}
                    <FeedbackPanel state={states.openai} />
                    {states.openai.status === "success" && states.openai.data && (
                        <OpenAIResult data={states.openai.data} />
                    )}
                </IntegrationCard>

                {/* ── Gemini API Key ──────────────────────────────────────────────── */}
                <IntegrationCard
                    icon="✨" name="Gemini" company="Google AI Studio"
                    gradientFrom="#1e3a8a" gradientTo="#3b82f6"
                    status={states.gemini.status}
                    description="Your Google AI Studio API key. Validates connectivity and lists all available Gemini models."
                    docUrl="https://aistudio.google.com/app/apikey"
                    docLabel="Get API Key from AI Studio →"
                    onDisconnect={states.gemini.status === "success" ? () => handleDisconnect("gemini", "gemini") : undefined}
                >
                    {states.gemini.status !== "success" && (
                        <div className="space-y-3">
                            <SecretInput
                                label="API Key"
                                placeholder="AIzaSy..."
                                value={geminiKey}
                                onChange={setGeminiKey}
                                visible={show.gemini}
                                onToggle={() => setShow(s => ({ ...s, gemini: !s.gemini }))}
                                disabled={states.gemini.status === "loading"}
                            />
                            <ConnectButton
                                status={states.gemini.status}
                                disabled={!geminiKey.trim()}
                                onClick={connectGemini}
                                gradient="linear-gradient(135deg, #1e3a8a, #3b82f6)"
                            />
                        </div>
                    )}
                    <FeedbackPanel state={states.gemini} />
                    {states.gemini.status === "success" && states.gemini.data && (
                        <GeminiResult data={states.gemini.data} />
                    )}
                </IntegrationCard>

                {/* ── Gemini Cloud Monitoring ──────────────────────────────────────── */}
                <IntegrationCard
                    icon={<Cloud className="w-5 h-5" />} name="Gemini — Cloud Monitoring" company="Google Cloud"
                    gradientFrom="#14532d" gradientTo="#16a34a"
                    status={states["gemini-monitoring"].status}
                    description="Optional: Provides 30-day API request history via Google Cloud Monitoring. Requires a service account JSON with the Monitoring Viewer role."
                    docUrl="https://console.cloud.google.com/iam-admin/serviceaccounts"
                    docLabel="Create Service Account in GCP →"
                    onDisconnect={states["gemini-monitoring"].status === "success" ? () => handleDisconnect("geminiMonitoring", "gemini-monitoring") : undefined}
                >
                    {states["gemini-monitoring"].status !== "success" && (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5">GCP Project ID</label>
                                <input
                                    type="text"
                                    placeholder="my-project-123456"
                                    value={gcpProjectId}
                                    onChange={e => setGcpProjectId(e.target.value)}
                                    disabled={states["gemini-monitoring"].status === "loading"}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all font-mono disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
                                    <FileJson className="w-3.5 h-3.5" /> Service Account JSON
                                </label>
                                <textarea
                                    placeholder={'{"type": "service_account", "project_id": "...", ...}'}
                                    value={serviceAccountJson}
                                    onChange={e => setServiceAccountJson(e.target.value)}
                                    rows={4}
                                    disabled={states["gemini-monitoring"].status === "loading"}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all font-mono resize-none disabled:opacity-50"
                                />
                                <p className="text-xs text-gray-600 mt-1">
                                    Enable the <strong className="text-gray-400">Cloud Monitoring API</strong> on the project and grant the service account <strong className="text-gray-400">Monitoring Viewer</strong> role.
                                </p>
                            </div>
                            <ConnectButton
                                status={states["gemini-monitoring"].status}
                                disabled={!gcpProjectId.trim() || !serviceAccountJson.trim()}
                                onClick={connectGeminiMonitoring}
                                gradient="linear-gradient(135deg, #14532d, #16a34a)"
                            />
                        </div>
                    )}
                    <FeedbackPanel state={states["gemini-monitoring"]} />
                    {states["gemini-monitoring"].status === "success" && states["gemini-monitoring"].data && (
                        <GeminiMonitoringResult data={states["gemini-monitoring"].data} />
                    )}
                </IntegrationCard>

            </div>
        </div>
    );
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function IntegrationCard({
    icon, name, company, gradientFrom, gradientTo, status, description, docUrl, docLabel, onDisconnect, children
}: {
    icon: React.ReactNode;
    name: string; company: string;
    gradientFrom: string; gradientTo: string;
    status: ConnectStatus; description: string;
    docUrl: string; docLabel: string;
    onDisconnect?: () => void;
    children: React.ReactNode;
}) {
    const statusConfig: Record<ConnectStatus, { label: string; cls: string }> = {
        idle: { label: "Not Connected", cls: "bg-gray-800 text-gray-400 border-gray-700" },
        loading: { label: "Connecting…", cls: "bg-blue-900/50 text-blue-300 border-blue-700 animate-pulse" },
        success: { label: "✓ Live", cls: "bg-green-900/50 text-green-300 border-green-700" },
        error: { label: "✗ Failed", cls: "bg-red-900/50 text-red-300 border-red-700" },
    };
    const { label, cls } = statusConfig[status];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        >
            <div className="p-6 border-b border-white/5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white"
                            style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                        >
                            {icon}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">{name}</h2>
                            <p className="text-xs text-gray-500">{company}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full border font-medium ${cls}`}>{label}</span>
                        {onDisconnect && (
                            <button
                                onClick={onDisconnect}
                                className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border border-red-700/50 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:border-red-600 transition-all"
                                title="Disconnect and clear stored data"
                            >
                                <Unplug className="w-3 h-3" />
                                Disconnect
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-400 mt-3">{description}</p>
                <a href={docUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs mt-2 text-blue-400 hover:text-blue-300 transition-colors">
                    <ExternalLink className="w-3 h-3" />{docLabel}
                </a>
            </div>
            <div className="p-6 space-y-3">{children}</div>
        </motion.div>
    );
}

function SecretInput({
    label, placeholder, value, onChange, visible, onToggle, disabled
}: {
    label: string; placeholder: string; value: string;
    onChange: (v: string) => void; visible: boolean;
    onToggle: () => void; disabled: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />{label}
            </label>
            <div className="relative">
                <input
                    type={visible ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all font-mono pr-10 disabled:opacity-50"
                />
                <button type="button" onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

function ConnectButton({
    status, disabled, onClick, gradient
}: {
    status: ConnectStatus; disabled: boolean; onClick: () => void; gradient: string;
}) {
    return (
        <motion.button
            onClick={onClick}
            disabled={disabled || status === "loading" || status === "success"}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed text-white"
            style={{ background: status === "success" ? "#16a34a" : gradient }}
        >
            {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> :
                status === "success" ? <Check className="w-4 h-4" /> :
                    <ChevronRight className="w-4 h-4" />}
            {status === "loading" ? "Connecting…" : status === "success" ? "Connected" : "Connect"}
        </motion.button>
    );
}

function FeedbackPanel({ state }: { state: IntegrationResult }) {
    return (
        <AnimatePresence>
            {state.status === "error" && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-xl p-3"
                >
                    <X className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{state.error}</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Result Panels ────────────────────────────────────────────────────────────

function ClaudeResult({ data }: { data: Record<string, unknown> }) {
    const totalTokens = (data.totalTokens as number) ?? 0;
    const totalInput = (data.totalInputTokens as number) ?? 0;
    const totalOutput = (data.totalOutputTokens as number) ?? 0;
    const models = (data.modelBreakdown as Record<string, { input: number; output: number }>) ?? {};
    const daily = (data.dailyTrend as { date: string; total: number }[]) ?? [];
    const last7 = daily.slice(-7);
    const maxVal = Math.max(...last7.map(d => d.total), 1);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2 border-t border-white/5">
            <div className="grid grid-cols-3 gap-3 text-sm">
                {[
                    { l: "Total Tokens (30d)", v: totalTokens.toLocaleString() },
                    { l: "Input Tokens", v: totalInput.toLocaleString() },
                    { l: "Output Tokens", v: totalOutput.toLocaleString() },
                ].map(s => (
                    <div key={s.l} className="bg-black/30 border border-white/5 rounded-xl p-3">
                        <p className="text-gray-500 text-xs mb-1">{s.l}</p>
                        <p className="font-mono font-bold text-orange-300 text-base">{s.v}</p>
                    </div>
                ))}
            </div>
            {last7.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Daily tokens — last 7 days</p>
                    <div className="flex items-end gap-1 h-14 bg-black/30 rounded-xl px-3 py-2">
                        {last7.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end">
                                <div className="w-full rounded-sm bg-orange-500/70 hover:bg-orange-400 transition-colors"
                                    style={{ height: `${(d.total / maxVal) * 100}%`, minHeight: "2px" }}
                                    title={`${d.date}: ${d.total.toLocaleString()} tokens`} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {Object.keys(models).length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Models used</p>
                    <div className="space-y-1.5">
                        {Object.entries(models).map(([model, usage]) => (
                            <div key={model} className="flex justify-between items-center bg-black/20 rounded-lg px-3 py-2 text-xs">
                                <span className="font-mono text-gray-300 truncate">{model}</span>
                                <span className="text-orange-300 font-mono ml-2">{(usage.input + usage.output).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function GeminiResult({ data }: { data: Record<string, unknown> }) {
    const models = (data.models as { id: string; name: string; inputTokenLimit: number }[]) ?? [];
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/20 rounded-xl p-3 text-sm">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-300">Key valid — {(data.totalModelsAvailable as number)} models accessible</span>
            </div>
            <div className="space-y-1.5">
                {models.slice(0, 5).map(m => (
                    <div key={m.id} className="flex justify-between items-center bg-black/20 rounded-lg px-3 py-2 text-xs">
                        <span className="font-mono text-blue-300 truncate">{m.name || m.id.split("/").pop()}</span>
                        <span className="text-gray-500 ml-2">{(m.inputTokenLimit / 1000).toFixed(0)}k ctx</span>
                    </div>
                ))}
            </div>
            <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>For 30-day usage history, connect Google Cloud Monitoring below.</span>
            </div>
        </motion.div>
    );
}

function GeminiMonitoringResult({ data }: { data: Record<string, unknown> }) {
    const total = (data.totalRequests as number) ?? 0;
    const daily = (data.dailyTrend as { date: string; requests: number }[]) ?? [];
    const last7 = daily.slice(-7);
    const maxVal = Math.max(...last7.map(d => d.requests), 1);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/20 rounded-xl p-3 text-sm">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-300">
                    {total.toLocaleString()} API requests in last 30 days (project: {data.projectId as string})
                </span>
            </div>
            {last7.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Daily requests — last 7 days</p>
                    <div className="flex items-end gap-1 h-14 bg-black/30 rounded-xl px-3 py-2">
                        {last7.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end">
                                <div className="w-full rounded-sm bg-green-500/70 hover:bg-green-400 transition-colors"
                                    style={{ height: `${(d.requests / maxVal) * 100}%`, minHeight: "2px" }}
                                    title={`${d.date}: ${d.requests} requests`} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

function OpenAIResult({ data }: { data: Record<string, unknown> }) {
    const models = (data.models as { id: string; ownedBy: string; created: string }[]) ?? [];
    const tier = (data.tier as string) ?? "Standard";
    const total = (data.totalModelsAvailable as number) ?? 0;
    const usageNote = (data.usageNote as string) ?? "";

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-2 border-t border-white/5">
            {/* Status row */}
            <div className="flex items-center gap-2 bg-green-900/20 border border-green-500/20 rounded-xl p-3 text-sm">
                <Check className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-green-300">Key valid — {total} models accessible · Tier: <strong>{tier}</strong></span>
            </div>

            {/* Model list */}
            <div>
                <p className="text-xs text-gray-500 mb-2">Accessible models</p>
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {models.map(m => (
                        <div key={m.id} className="flex justify-between items-center bg-black/20 rounded-lg px-3 py-2 text-xs">
                            <span className="font-mono text-emerald-300 truncate">{m.id}</span>
                            <div className="flex gap-2 ml-2 shrink-0 text-gray-500">
                                <span>{m.created}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Usage note */}
            {usageNote && (
                <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-300">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{usageNote}</span>
                </div>
            )}
        </motion.div>
    );
}
