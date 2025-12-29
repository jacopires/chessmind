
import { ARISTOTELES_SYSTEM_PROMPT } from './aristoteles-prompt'

export interface AIAnalysisRequest {
    fen: string;
    UserPrompt?: string; // Optional user question
    pgn?: string;
    moveHistory?: string[];
    move?: string; // User's last move
    moveQuality?: 'Blunder' | 'Mistake' | 'Good' | 'Best'; // Evaluation
    bestMove?: string; // Engine suggestion
}

export interface AIAnalysisResponse {
    analysis: string;
}

export const analyzePosition = async (data: AIAnalysisRequest): Promise<string> => {
    // 1. Get Settings from LocalStorage
    const settingsStr = localStorage.getItem('chessmaster_settings');
    if (!settingsStr) {
        throw new Error("Configurações não encontradas. Por favor, configure sua API Key na página de Configurações.");
    }

    const settings = JSON.parse(settingsStr);
    const apiKey = settings.apiKey;
    const model = settings.model || 'gpt-4o-mini';
    const temperature = settings.temperature || 0.7;
    const maxTokens = settings.maxTokens || 1000;

    if (!apiKey) {
        throw new Error("API Key não configurada.");
    }

    // 2. Construct Prompt using Aristóteles personality
    const userContent = `
    Posição FEN: ${data.fen}
    ${data.pgn ? `PGN: ${data.pgn}` : ''}
    Lance do Usuário: ${data.move || 'N/A'}
    Qualidade do Lance: ${data.moveQuality || 'N/A'}
    Melhor Lance (Engine): ${data.bestMove || 'N/A'}
    ${data.UserPrompt ? `Pergunta do Usuário: ${data.UserPrompt}` : ''}
    `;
    // 3. Call OpenAI API
    const callApi = async (selectedModel: string) => {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { role: "system", content: ARISTOTELES_SYSTEM_PROMPT },
                    { role: "user", content: userContent }
                ],
                temperature: temperature,
                max_tokens: maxTokens
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || response.statusText);
        }

        return await response.json();
    };

    try {
        const result = await callApi(model);
        return result.choices[0].message.content;

    } catch (error: any) {
        // If error is related to invalid model (400), try fallback to gpt-4o-mini
        if (error.message && (error.message.includes('model') || error.message.includes('not supported'))) {
            console.warn(`Model ${model} failed, retrying with gpt-4o-mini...`);
            try {
                const fallbackResult = await callApi('gpt-4o-mini');
                return fallbackResult.choices[0].message.content;
            } catch (fallbackError) {
                console.error("Fallback failed:", fallbackError);
                throw fallbackError;
            }
        }

        console.error("Erro ao chamar OpenAI:", error);
        throw new Error(`Erro na API: ${error.message || 'Desconhecido'}`);
    }
};
