import { NextRequest, NextResponse } from 'next/server';

// Anthropic Admin API - Usage Report
// Requires an Admin API key from console.anthropic.com
export async function POST(req: NextRequest) {
    const { adminKey } = await req.json();

    if (!adminKey) {
        return NextResponse.json({ error: 'Admin API key is required' }, { status: 400 });
    }

    // Calculate 30-day window
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const starting_at = startDate.toISOString().split('.')[0] + 'Z';
    const ending_at = endDate.toISOString().split('.')[0] + 'Z';

    try {
        // Fetch usage report from Anthropic Admin API
        const usageRes = await fetch(
            `https://api.anthropic.com/v1/usage/messages?bucket_width=1d&starting_at=${starting_at}&ending_at=${ending_at}`,
            {
                headers: {
                    'x-api-key': adminKey,
                    'anthropic-version': '2023-06-01',
                },
            }
        );

        if (!usageRes.ok) {
            const err = await usageRes.json().catch(() => ({}));
            return NextResponse.json({ error: err?.error?.message || `Anthropic API error: ${usageRes.status}` }, { status: usageRes.status });
        }

        const usage = await usageRes.json();

        // Aggregate across all buckets
        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        const modelBreakdown: Record<string, { input: number; output: number }> = {};
        const dailyTrend: { date: string; input: number; output: number; total: number }[] = [];

        for (const bucket of usage.data ?? []) {
            const input = bucket.input_tokens ?? 0;
            const output = bucket.output_tokens ?? 0;
            totalInputTokens += input;
            totalOutputTokens += output;

            const model = bucket.model ?? 'unknown';
            if (!modelBreakdown[model]) modelBreakdown[model] = { input: 0, output: 0 };
            modelBreakdown[model].input += input;
            modelBreakdown[model].output += output;

            const day = dailyTrend.find(d => d.date === bucket.start_time?.split('T')[0]);
            if (day) {
                day.input += input;
                day.output += output;
                day.total += input + output;
            } else {
                dailyTrend.push({
                    date: bucket.start_time?.split('T')[0] ?? '',
                    input,
                    output,
                    total: input + output,
                });
            }
        }

        return NextResponse.json({
            provider: 'claude',
            totalInputTokens,
            totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
            modelBreakdown,
            dailyTrend: dailyTrend.sort((a, b) => a.date.localeCompare(b.date)),
            raw: usage,
        });
    } catch (err) {
        console.error('Claude integration error:', err);
        return NextResponse.json({ error: 'Failed to connect to Anthropic API' }, { status: 500 });
    }
}
