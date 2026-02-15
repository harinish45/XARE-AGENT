import OpenAI from 'openai';

// Shared AI Client Factory
// Supports Zero-Cost strategy by checking multiple providers
export const createAIClient = (apiKey?: string, baseUrl?: string) => {
    // Priority: 
    // 1. Explicitly passed args (User overrides)
    // 2. Groq (Fastest/Free tier)
    // 3. OpenAI (Standard)
    // 4. Local Ollama (Zero cost, local)

    const finalApiKey = apiKey || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || 'ollama';

    let finalBaseURL = baseUrl;
    if (!finalBaseURL) {
        if (apiKey) {
            // If user provided key, assume standard OpenAI unless URL provided
            finalBaseURL = undefined;
        } else if (process.env.GROQ_API_KEY) {
            finalBaseURL = 'https://api.groq.com/openai/v1';
        } else if (process.env.OPENAI_API_KEY) {
            finalBaseURL = undefined;
        } else {
            finalBaseURL = 'http://localhost:11434/v1';
        }
    }

    return new OpenAI({
        apiKey: finalApiKey,
        baseURL: finalBaseURL,
        dangerouslyAllowBrowser: true, // Critical for client-side execution
    });
};
