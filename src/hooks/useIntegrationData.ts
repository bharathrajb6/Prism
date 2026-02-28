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
    localStorage.removeItem(`${email}_${KEYS[tool as ToolKey]}`);
    localStorage.removeItem(`${email}_prism_${tool === "geminiMonitoring" ? "gemini-monitoring" : tool}_key`);
    window.dispatchEvent(new Event("prism-storage-changed"));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIntegrationData(): IntegrationStore & { refresh: () => void } {
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

    return { ...store, refresh };
}

// ─── persist helper (fires custom event so Dashboard re-reads immediately) ────

export function persistIntegration(email: string, key: string, data: unknown): void {
    if (typeof window === "undefined" || !email) return;
    localStorage.setItem(`${email}_prism_${key}_key`, typeof data === "string" ? data : "");
    localStorage.setItem(`${email}_prism_${key}_data`, JSON.stringify(data));
    window.dispatchEvent(new Event("prism-storage-changed"));
}


