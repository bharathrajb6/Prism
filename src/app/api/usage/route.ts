import { NextResponse } from 'next/server';

// In a real application, this dynamic data would be fetched from database or real APIs.
// For the architectural MVP, this returns structured, simulated real-time data.
export async function GET() {
  const data = {
    overview: {
      totalTokens: 2456000,
      totalCostRaw: 45.2,
      hoursSaved: 124,
      mostUsedTool: 'Cursor',
    },
    toolsUsage: [
      { name: 'Cursor', tokens: 1250000, sessions: 340, models: ['Claude 3.5 Sonnet', 'GPT-4o'], color: '#ffffff' },
      { name: 'Copilot', tokens: 450000, sessions: 520, models: ['OpenAI Codex'], color: '#6e40c9' },
      { name: 'Antigravity / Gemini', tokens: 380000, sessions: 110, models: ['Gemini 1.5 Pro', 'Antigravity Agent'], color: '#1a73e8' },
      { name: 'Claude', tokens: 200000, sessions: 85, models: ['Claude 3 Opus', 'Claude 3.5 Sonnet'], color: '#d97757' },
      { name: 'Windsurf', tokens: 176000, sessions: 45, models: ['GPT-4o', 'Claude 3.5 Sonnet'], color: '#00d1b2' }
    ],
    weeklyTrend: [
      { day: 'Mon', Cursor: 12, Copilot: 15, Antigravity: 4, Claude: 3, Windsurf: 1 },
      { day: 'Tue', Cursor: 18, Copilot: 12, Antigravity: 8, Claude: 5, Windsurf: 2 },
      { day: 'Wed', Cursor: 25, Copilot: 14, Antigravity: 6, Claude: 7, Windsurf: 5 },
      { day: 'Thu', Cursor: 22, Copilot: 10, Antigravity: 10, Claude: 4, Windsurf: 6 },
      { day: 'Fri', Cursor: 30, Copilot: 18, Antigravity: 12, Claude: 6, Windsurf: 4 },
      { day: 'Sat', Cursor: 8, Copilot: 5, Antigravity: 2, Claude: 1, Windsurf: 0 },
      { day: 'Sun', Cursor: 5, Copilot: 2, Antigravity: 1, Claude: 0, Windsurf: 0 },
    ],
    models: [
      { name: 'Claude 3.5 Sonnet', usage: 45 },
      { name: 'GPT-4o', usage: 35 },
      { name: 'Gemini 1.5 Pro', usage: 12 },
      { name: 'OpenAI Codex', usage: 8 }
    ]
  };

  return NextResponse.json(data);
}
