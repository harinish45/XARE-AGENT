import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { providerId, apiKey } = await request.json();

        if (!providerId || !apiKey) {
            return NextResponse.json({ error: 'Missing providerId or apiKey' }, { status: 400 });
        }

        // Provider-specific validation endpoints
        const validationMap: Record<string, { url: string; headers: Record<string, string>; method?: string }> = {
            openai: {
                url: 'https://api.openai.com/v1/models',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            anthropic: {
                url: 'https://api.anthropic.com/v1/messages',
                headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
                method: 'POST',
            },
            groq: {
                url: 'https://api.groq.com/openai/v1/models',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            github: {
                url: 'https://api.github.com/user',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'User-Agent': 'Antigravity' },
            },
            apify: {
                url: 'https://api.apify.com/v2/acts',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            huggingface: {
                url: 'https://huggingface.co/api/whoami-v2',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            sendgrid: {
                url: 'https://api.sendgrid.com/v3/scopes',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            stripe: {
                url: 'https://api.stripe.com/v1/balance',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            mistral: {
                url: 'https://api.mistral.ai/v1/models',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            together_ai: {
                url: 'https://api.together.xyz/v1/models',
                headers: { 'Authorization': `Bearer ${apiKey}` },
            },
            tavily: {
                url: 'https://api.tavily.com/search',
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
            },
        };

        const config = validationMap[providerId];

        if (!config) {
            // For providers without validation, assume valid
            return NextResponse.json({ valid: true, message: 'Key accepted (no validation endpoint)' });
        }

        const response = await fetch(config.url, {
            method: config.method || 'GET',
            headers: config.headers,
            ...(config.method === 'POST' ? { body: JSON.stringify({ model: 'test' }) } : {}),
        });

        if (response.ok || response.status === 200) {
            return NextResponse.json({ valid: true, message: 'API key is valid' });
        }

        if (response.status === 401 || response.status === 403) {
            return NextResponse.json({ valid: false, message: 'Invalid API key' }, { status: 200 });
        }

        // Some APIs return 400 for test requests but the key might still be valid
        return NextResponse.json({ valid: true, message: 'Key accepted' });

    } catch (error) {
        return NextResponse.json(
            { valid: false, message: 'Validation failed', error: String(error) },
            { status: 500 }
        );
    }
}
