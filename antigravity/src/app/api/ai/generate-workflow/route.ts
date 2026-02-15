import { NextRequest, NextResponse } from 'next/server';
import { generateWorkflowFromPrompt } from '@/lib/ai/workflow-generator';

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        const workflow = await generateWorkflowFromPrompt(prompt);

        return NextResponse.json({ workflow });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
