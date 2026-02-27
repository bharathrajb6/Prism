import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

const MONITORING_SCOPE = 'https://www.googleapis.com/auth/monitoring.read';
const MONITORING_BASE = 'https://monitoring.googleapis.com/v3';

export async function POST(req: NextRequest) {
    const { serviceAccountJson, projectId } = await req.json();

    if (!serviceAccountJson || !projectId) {
        return NextResponse.json(
            { error: 'Both serviceAccountJson and projectId are required' },
            { status: 400 }
        );
    }

    let credentials: object;
    try {
        credentials = typeof serviceAccountJson === 'string'
            ? JSON.parse(serviceAccountJson)
            : serviceAccountJson;
    } catch {
        return NextResponse.json({ error: 'Invalid service account JSON' }, { status: 400 });
    }

    try {
        const auth = new GoogleAuth({ credentials, scopes: [MONITORING_SCOPE] });
        const client = await auth.getClient();
        const tokenResp = await client.getAccessToken();
        const accessToken = tokenResp?.token;
        if (!accessToken) throw new Error('Failed to obtain access token');

        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const startTime = thirtyDaysAgo.toISOString();
        const endTime = now.toISOString();

        // Query 1: Request counts per model for the Generative Language (AI Studio) API
        const requestFilter = [
            'metric.type="serviceruntime.googleapis.com/api/request_count"',
            'resource.labels.service="generativelanguage.googleapis.com"',
        ].join(' AND ');

        const reqCountUrl = new URL(`${MONITORING_BASE}/projects/${projectId}/timeSeries`);
        reqCountUrl.searchParams.set('filter', requestFilter);
        reqCountUrl.searchParams.set('interval.startTime', startTime);
        reqCountUrl.searchParams.set('interval.endTime', endTime);
        reqCountUrl.searchParams.set('aggregation.alignmentPeriod', '86400s');
        reqCountUrl.searchParams.set('aggregation.perSeriesAligner', 'ALIGN_RATE');
        reqCountUrl.searchParams.set('aggregation.crossSeriesReducer', 'REDUCE_SUM');
        reqCountUrl.searchParams.set('aggregation.groupByFields', 'metric.labels.method');

        const reqCountRes = await fetch(reqCountUrl.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!reqCountRes.ok) {
            const errText = await reqCountRes.text();
            return NextResponse.json(
                { error: `Cloud Monitoring API error (${reqCountRes.status}): ${errText}` },
                { status: reqCountRes.status }
            );
        }

        const reqCountData = await reqCountRes.json();

        // Query 2: Token count metrics (available for Generative Language API)
        const tokenFilter = [
            'metric.type="serviceruntime.googleapis.com/quota/rate/net_usage"',
            'resource.labels.service="generativelanguage.googleapis.com"',
        ].join(' AND ');

        const tokenUrl = new URL(`${MONITORING_BASE}/projects/${projectId}/timeSeries`);
        tokenUrl.searchParams.set('filter', tokenFilter);
        tokenUrl.searchParams.set('interval.startTime', startTime);
        tokenUrl.searchParams.set('interval.endTime', endTime);
        tokenUrl.searchParams.set('aggregation.alignmentPeriod', '86400s');
        tokenUrl.searchParams.set('aggregation.perSeriesAligner', 'ALIGN_RATE');

        const tokenRes = await fetch(tokenUrl.toString(), {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        const tokenData = tokenRes.ok ? await tokenRes.json() : { timeSeries: [] };

        // Process time series into daily buckets
        const dailyRequests: Record<string, number> = {};
        let totalRequests = 0;

        for (const series of reqCountData.timeSeries ?? []) {
            for (const point of series.points ?? []) {
                const day = point.interval?.startTime?.split('T')[0] ?? '';
                const val = Number(point.value?.doubleValue ?? point.value?.int64Value ?? 0);
                dailyRequests[day] = (dailyRequests[day] ?? 0) + val;
                totalRequests += val;
            }
        }

        const dailyTrend = Object.entries(dailyRequests)
            .map(([date, requests]) => ({ date, requests: Math.round(requests) }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            provider: 'gemini-monitoring',
            projectId,
            totalRequests: Math.round(totalRequests),
            dailyTrend,
            rawTimeSeries: (reqCountData.timeSeries ?? []).length,
            tokenSeries: (tokenData.timeSeries ?? []).length,
            note: 'Request counts sourced from Google Cloud Monitoring (serviceruntime API). Token-level granularity requires Vertex AI.',
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Gemini Monitoring error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
