"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClaudeData {
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    modelBreakdown: Record<string, { input: number; output: number }>;
    dailyTrend: { date: string; input: number; output: number; total: number }[];
}

export interface GeminiData {
    keyValid: boolean;
    totalModelsAvailable: number;
    models: { id: string; name: string; inputTokenLimit: number }[];
}

export interface GeminiMonitoringData {
    totalRequests: number;
    dailyTrend: { date: string; requests: number }[];
    projectId: string;
}

export interface OpenAIData {
    keyValid: boolean;
    tier: string;
    totalModelsAvailable: number;
    models: { id: string; name: string; ownedBy: string; created: string }[];
    usageNote: string;
}

export interface IntegrationStore {
    claude: ClaudeData | null;
    gemini: GeminiData | null;
    geminiMonitoring: GeminiMonitoringData | null;
    openai: OpenAIData | null;
    isRefetching?: boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const KEYS = {
    claude: "prism_claude_data",
    gemini: "prism_gemini_data",
    geminiMonitoring: "prism_gemini-monitoring_data",
    openai: "prism_openai_data",
} as const;

type ToolKey = keyof typeof KEYS;

function tryParse<T>(storageKey: string): T | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(storageKey);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

export function readAll(email: string): IntegrationStore {
    if (!email) {
        return { claude: null, gemini: null, geminiMonitoring: null, openai: null };
    }
    return {
        claude: tryParse<ClaudeData>(`${email}_${KEYS.claude}`),
        gemini: tryParse<GeminiData>(`${email}_${KEYS.gemini}`),
        geminiMonitoring: tryParse<GeminiMonitoringData>(`${email}_${KEYS.geminiMonitoring}`),
        openai: tryParse<OpenAIData>(`${email}_${KEYS.openai}`),
    };
}

// ─── Disconnect helper (exported so ConnectPage / Dashboard can use it) ───────

export function disconnectTool(email: string, tool: ToolKey | "geminiMonitoring"): void {
    if (typeof window === "undefined" || !email) return;
    const keyString = tool === "geminiMonitoring" ? "gemini-monitoring" : tool;
    localStorage.removeItem(`${email}_${KEYS[tool as ToolKey]}`);
    localStorage.removeItem(`${email}_prism_${keyString}_key`);
    localStorage.removeItem(`${email}_prism_${keyString}_secret`);
    window.dispatchEvent(new Event("prism-storage-changed"));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIntegrationData(): IntegrationStore & { refresh: () => void; refetchAll: () => Promise<void> } {
    const { data: session } = useSession();
    const email = session?.user?.email || "";

    const [store, setStore] = useState<IntegrationStore>({
        claude: null,
        gemini: null,
        geminiMonitoring: null,
        openai: null,
    });

    const refresh = useCallback(() => {
        setStore(readAll(email));
    }, [email]);

    const refetchAll = useCallback(async () => {
        if (!email) return;
        setStore(prev => ({ ...prev, isRefetching: true }));
        try {
            const promises = [];

            const claudeSecretRaw = localStorage.getItem(`${email}_prism_claude_secret`);
            if (claudeSecretRaw) {
                const secret = JSON.parse(claudeSecretRaw);
                promises.push(fetch("/api/integrations/claude", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(secret) })
                    .then(r => r.json()).then(d => { if (d && !d.error) persistIntegration(email, "claude", d, secret); }));
            }

            const geminiSecretRaw = localStorage.getItem(`${email}_prism_gemini_secret`);
            if (geminiSecretRaw) {
                const secret = JSON.parse(geminiSecretRaw);
                promises.push(fetch("/api/integrations/gemini", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(secret) })
                    .then(r => r.json()).then(d => { if (d && !d.error) persistIntegration(email, "gemini", d, secret); }));
            }

            const geminiMonSecretRaw = localStorage.getItem(`${email}_prism_gemini-monitoring_secret`);
            if (geminiMonSecretRaw) {
                const secret = JSON.parse(geminiMonSecretRaw);
                promises.push(fetch("/api/integrations/gemini-monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(secret) })
                    .then(r => r.json()).then(d => { if (d && !d.error) persistIntegration(email, "gemini-monitoring", d, secret); }));
            }

            const openaiSecretRaw = localStorage.getItem(`${email}_prism_openai_secret`);
            if (openaiSecretRaw) {
                const secret = JSON.parse(openaiSecretRaw);
                promises.push(fetch("/api/integrations/openai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(secret) })
                    .then(r => r.json()).then(d => { if (d && !d.error) persistIntegration(email, "openai", d, secret); }));
            }

            await Promise.allSettled(promises);
        } finally {
            refresh();
            setStore(prev => ({ ...prev, isRefetching: false }));
        }
    }, [email, refresh]);

    useEffect(() => {
        if (!email) return;

        refresh();

        const onStorageEvent = (e: StorageEvent) => {
            refresh();
        };

        // Re-read on our custom same-tab event (fired by disconnectTool and persist)
        const onCustomEvent = () => refresh();

        window.addEventListener("storage", onStorageEvent);
        window.addEventListener("prism-storage-changed", onCustomEvent);
        return () => {
            window.removeEventListener("storage", onStorageEvent);
            window.removeEventListener("prism-storage-changed", onCustomEvent);
        };
    }, [refresh, email]);

    return { ...store, refresh, refetchAll };
}

// ─── persist helper (fires custom event so Dashboard re-reads immediately) ────

export function persistIntegration(email: string, key: string, data: unknown, secret?: unknown): void {
    if (typeof window === "undefined" || !email) return;
    if (secret) {
        localStorage.setItem(`${email}_prism_${key}_secret`, JSON.stringify(secret));
    }
    localStorage.setItem(`${email}_prism_${key}_key`, typeof data === "string" ? data : "");
    localStorage.setItem(`${email}_prism_${key}_data`, JSON.stringify(data));
    window.dispatchEvent(new Event("prism-storage-changed"));
}


