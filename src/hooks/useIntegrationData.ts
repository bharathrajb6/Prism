"use client";

import { useState, useEffect, useCallback } from "react";

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

function readAll(): IntegrationStore {
    return {
        claude: tryParse<ClaudeData>(KEYS.claude),
        gemini: tryParse<GeminiData>(KEYS.gemini),
        geminiMonitoring: tryParse<GeminiMonitoringData>(KEYS.geminiMonitoring),
        openai: tryParse<OpenAIData>(KEYS.openai),
    };
}

// ─── Disconnect helper (exported so ConnectPage / Dashboard can use it) ───────

export function disconnectTool(tool: ToolKey): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(KEYS[tool]);
    // also remove the raw key entry
    localStorage.removeItem(`prism_${tool === "geminiMonitoring" ? "gemini-monitoring" : tool}_key`);
    // fire a storage event so other same-tab consumers react
    window.dispatchEvent(new Event("prism-storage-changed"));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIntegrationData(): IntegrationStore & { refresh: () => void } {
    const [store, setStore] = useState<IntegrationStore>({
        claude: null,
        gemini: null,
        geminiMonitoring: null,
        openai: null,
    });

    const refresh = useCallback(() => {
        setStore(readAll());
    }, []);

    useEffect(() => {
        // Read immediately on mount (client-side only)
        refresh();

        // Re-read when localStorage changes from another tab
        const onStorageEvent = (e: StorageEvent) => {
            const watched = Object.values(KEYS) as string[];
            if (!e.key || watched.includes(e.key)) refresh();
        };

        // Re-read on our custom same-tab event (fired by disconnectTool and persist)
        const onCustomEvent = () => refresh();

        window.addEventListener("storage", onStorageEvent);
        window.addEventListener("prism-storage-changed", onCustomEvent);
        return () => {
            window.removeEventListener("storage", onStorageEvent);
            window.removeEventListener("prism-storage-changed", onCustomEvent);
        };
    }, [refresh]);

    return { ...store, refresh };
}

// ─── persist helper (fires custom event so Dashboard re-reads immediately) ────

export function persistIntegration(key: string, data: unknown): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(`prism_${key}_key`, typeof data === "string" ? data : "");
    localStorage.setItem(`prism_${key}_data`, JSON.stringify(data));
    window.dispatchEvent(new Event("prism-storage-changed"));
}

// ─── Mock Data Fallback ────────────────────────────────────────────────────────

export const MOCK_DATA = {
    weeklyTrend: [
        { day: "Mon", Claude: 12000, Gemini: 4000, ChatGPT: 8000 },
        { day: "Tue", Claude: 18000, Gemini: 8000, ChatGPT: 11000 },
        { day: "Wed", Claude: 25000, Gemini: 6000, ChatGPT: 15000 },
        { day: "Thu", Claude: 22000, Gemini: 10000, ChatGPT: 9000 },
        { day: "Fri", Claude: 30000, Gemini: 12000, ChatGPT: 20000 },
        { day: "Sat", Claude: 8000, Gemini: 2000, ChatGPT: 5000 },
        { day: "Sun", Claude: 5000, Gemini: 1000, ChatGPT: 2000 },
    ],
    models: [
        { name: "claude-3-5-sonnet", usage: 35 },
        { name: "gpt-4o", usage: 30 },
        { name: "claude-3-opus", usage: 15 },
        { name: "gemini-1.5-pro", usage: 12 },
        { name: "gpt-4-turbo", usage: 8 },
    ],
};
