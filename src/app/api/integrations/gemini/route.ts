import { NextRequest, NextResponse } from 'next/server';

// Google Gemini - Generative Language API
// Uses standard Gemini API key from aistudio.google.com
export async function POST(req: NextRequest) {
    const { apiKey } = await req.json();

    if (!apiKey) {
        return NextResponse.json({ error: 'Gemini API key is required' }, { status: 400 });
    }

    try {
        // Step 1: Validate key and list available models
        const modelsRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=50`
        );

        if (!modelsRes.ok) {
            const err = await modelsRes.json().catch(() => ({}));
            return NextResponse.json({ error: err?.error?.message || `Gemini API error: ${modelsRes.status}` }, { status: modelsRes.status });
        }

        const modelsData = await modelsRes.json();

        // Filter to production Gemini models only
        const geminiModels = (modelsData.models ?? []).filter(
            (m: { name?: string }) => m.name?.includes('gemini')
        );

        // Step 2: Collect token limits for each key model
        const modelDetails = await Promise.all(
            geminiModels.slice(0, 6).map(async (m: { name?: string; displayName?: string; inputTokenLimit?: number; outputTokenLimit?: number }) => {
                return {
                    id: m.name ?? '',
                    name: m.displayName ?? m.name ?? '',
                    inputTokenLimit: m.inputTokenLimit ?? 0,
                    outputTokenLimit: m.outputTokenLimit ?? 0,
                };
            })
        );

        // Step 3: Make a tiny generateContent call to verify the key is active
        // and get actual token count metadata from the API
        const testModel = 'gemini-1.5-flash';
        const countRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:countTokens?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello' }] }],
                }),
            }
        );

        let liveTokenCount = null;
        if (countRes.ok) {
            const countData = await countRes.json();
            liveTokenCount = countData.totalTokens;
        }

        // Note: Google AI Studio does not expose historical usage via a public REST API.
        // For per-request usage data, you need Google Cloud Monitoring (requires a service account).
        // We surface the available models, limits, and key validity here.
        return NextResponse.json({
            provider: 'gemini',
            keyValid: true,
            totalModelsAvailable: geminiModels.length,
            models: modelDetails,
            liveTokenCount,
            note: 'Google AI Studio does not expose historical usage via public API. Showing model capabilities and key validity. Enable Google Cloud Monitoring for full usage metrics.',
        });

    } catch (err) {
        console.error('Gemini integration error:', err);
        return NextResponse.json({ error: 'Failed to connect to Gemini API' }, { status: 500 });
    }
}
