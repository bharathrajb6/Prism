const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');

async function run() {
    const credsStr = fs.readFileSync('/Users/bharathsr/Downloads/gen-lang-client-0159644810-256a4e073f21.json', 'utf8');
    const credentials = JSON.parse(credsStr);
    const projectId = credentials.project_id;
    
    const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/monitoring.read'] });
    const client = await auth.getClient();
    const tokenResp = await client.getAccessToken();
    const accessToken = tokenResp?.token;

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const MONITORING_BASE = 'https://monitoring.googleapis.com/v3';
    const requestFilter = [
        'metric.type="serviceruntime.googleapis.com/api/request_count"',
        'resource.labels.service="generativelanguage.googleapis.com"',
    ].join(' AND ');

    // Test ALIGN_RATE
    console.log('Testing ALIGN_RATE...');
    const urlRate = new URL(`${MONITORING_BASE}/projects/${projectId}/timeSeries`);
    urlRate.searchParams.set('filter', requestFilter);
    urlRate.searchParams.set('interval.startTime', thirtyDaysAgo.toISOString());
    urlRate.searchParams.set('interval.endTime', now.toISOString());
    urlRate.searchParams.set('aggregation.alignmentPeriod', '86400s');
    urlRate.searchParams.set('aggregation.perSeriesAligner', 'ALIGN_RATE');
    urlRate.searchParams.set('aggregation.crossSeriesReducer', 'REDUCE_SUM');
    urlRate.searchParams.set('aggregation.groupByFields', 'metric.labels.method');
    
    const resRate = await fetch(urlRate.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    const dataRate = await resRate.json();
    console.log(JSON.stringify(dataRate, null, 2).substring(0, 500));

    // Test ALIGN_SUM
    console.log('\nTesting ALIGN_SUM...');
    const urlSum = new URL(`${MONITORING_BASE}/projects/${projectId}/timeSeries`);
    urlSum.searchParams.set('filter', requestFilter);
    urlSum.searchParams.set('interval.startTime', thirtyDaysAgo.toISOString());
    urlSum.searchParams.set('interval.endTime', now.toISOString());
    urlSum.searchParams.set('aggregation.alignmentPeriod', '86400s');
    urlSum.searchParams.set('aggregation.perSeriesAligner', 'ALIGN_SUM'); // CHANGED HERE
    urlSum.searchParams.set('aggregation.crossSeriesReducer', 'REDUCE_SUM');
    urlSum.searchParams.set('aggregation.groupByFields', 'metric.labels.method');
    
    const resSum = await fetch(urlSum.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
    const dataSum = await resSum.json();
    console.log(JSON.stringify(dataSum, null, 2).substring(0, 500));
}

run().catch(console.error);
