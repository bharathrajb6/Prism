import { NextRequest, NextResponse } from 'next/server';

// OpenAI standard API key integration
// Uses /v1/models to validate the key and list accessible GPT models.
// Note: Usage history (token counts per day) requires an Admin API key.
// With a standard key we show model availability and validate connectivity.
export async function POST(req: NextRequest) {
    const { apiKey } = await req.json();

    if (!apiKey) {
        return NextResponse.json({ error: 'API key is required' }, { status: 400 });
    }

    try {
        // 1. Validate key + list models
        const modelsRes = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!modelsRes.ok) {
            const err = await modelsRes.json().catch(() => ({}));
            const msg =
                (err as { error?: { message?: string } })?.error?.message ||
                `OpenAI API error: ${modelsRes.status}`;
            return NextResponse.json({ error: msg }, { status: modelsRes.status });
        }

        const modelsData = await modelsRes.json();
        const allModels: { id: string; created: number; owned_by: string }[] =
            modelsData.data ?? [];

        // Filter to GPT / o1 / o3 models the user can actually call
        const relevantModels = allModels
            .filter(m =>
                m.id.startsWith('gpt') ||
                m.id.startsWith('o1') ||
                m.id.startsWith('o3') ||
                m.id.startsWith('chatgpt')
            )
            .sort((a, b) => b.created - a.created)
            .slice(0, 20)
            .map(m => ({
                id: m.id,
                name: m.id,
                ownedBy: m.owned_by,
                created: new Date(m.created * 1000).toISOString().split('T')[0],
            }));

        // 2. Try to get basic account info (available to standard keys)
        // We read the subscription endpoint to see tier info
        // (best-effort, may 404 on newer billing)
        let tier = 'Standard';
        try {
            const subRes = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (subRes.ok) {
                const sub = await subRes.json();
                tier = sub?.plan?.title ?? sub?.access_until ? 'Pay-as-you-go' : 'Free';
            }
        } catch {
            // fine to skip
        }

        return NextResponse.json({
            provider: 'openai',
            keyValid: true,
            tier,
            totalModelsAvailable: relevantModels.length,
            models: relevantModels,
            usageNote:
                'Historical token usage requires an Admin API key. ' +
                'Connect an Admin key to see 30-day token breakdowns.',
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('OpenAI integration error:', message);
        return NextResponse.json({ error: 'Failed to connect to OpenAI API' }, { status: 500 });
    }
}
