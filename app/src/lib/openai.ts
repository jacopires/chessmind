
import { ARISTOTELES_SYSTEM_PROMPT, buildAristotelesPrompt, type AristotelesContext } from './aristoteles-prompt'

export interface AIAnalysisRequest {
    fen: string
    UserPrompt?: string
    pgn?: string
    moveHistory?: string[]
    move?: string
    moveQuality?: 'Blunder' | 'Mistake' | 'Good' | 'Best'
    bestMove?: string
    timeRemaining?: number // NEW: seconds remaining
    recentMoves?: string[] // NEW: last 3-5 moves for momentum
    evaluation?: number
}

export type MoveQuality = 'Best' | 'Good' | 'Mistake' | 'Blunder'

export interface AIAnalysisResponse {
    text: string
    quality: MoveQuality
}

// Helper function to extract move quality from Aristóteles feedback
function extractQuality(text: string): MoveQuality {
    const lowerText = text.toLowerCase()

    // Blunders - erros graves
    if (lowerText.includes('erro grave') ||
        lowerText.includes('blunder') ||
        lowerText.includes('desastre') ||
        lowerText.includes('catastrófico') ||
        lowerText.includes('presenteou')) {
        return 'Blunder'
    }

    // Mistakes - imprecisões
    if (lowerText.includes('impreciso') ||
        lowerText.includes('mistake') ||
        lowerText.includes('poderia ser melhor') ||
        lowerText.includes('duvidoso')) {
        return 'Mistake'
    }

    // Best moves - excelente, brilhante
    if (lowerText.includes('excelente') ||
        lowerText.includes('brilhante') ||
        lowerText.includes('perfeito') ||
        lowerText.includes('magistral')) {
        return 'Best'
    }

    // Default to Good
    return 'Good'
}

export async function analyzePosition(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    const apiKey = localStorage.getItem('OPENAI_API_KEY')

    if (!apiKey) {
        throw new Error("API Key não config urada")
    }

    // Build contextual prompt with new system
    const context: AristotelesContext = {
        fen: request.fen,
        move: request.move,
        moveQuality: request.moveQuality,
        bestMove: request.bestMove,
        evaluation: request.evaluation,
        timeRemaining: request.timeRemaining,
        recentMoves: request.recentMoves,
        userPrompt: request.UserPrompt
    }

    const userMessage = request.UserPrompt || buildAristotelesPrompt(context)

    // Call OpenAI API
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
                    { role: "user", content: userMessage }
                ],
                temperature: parseFloat(localStorage.getItem('AI_TEMPERATURE') || '0.7'),
                max_tokens: parseInt(localStorage.getItem('AI_MAX_TOKENS') || '800')
            })
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.error?.message || `HTTP ${response.status}`)
        }

        return await response.json()
    }

    try {
        const model = localStorage.getItem('AI_MODEL') || 'gpt-4o-mini'
        const result = await callApi(model)

        if (result.choices && result.choices.length > 0) {
            const text = result.choices[0].message.content || "Análise não disponível"
            const quality = extractQuality(text)

            return { text, quality }
        }

        throw new Error('Resposta vazia da IA')

    } catch (error: any) {
        // Fallback to gpt-4o-mini on model errors
        if (error.message && (error.message.includes('model') || error.message.includes('not supported'))) {
            console.warn('Model failed, retrying with gpt-4o-mini...')
            try {
                const fallbackResult = await callApi('gpt-4o-mini')
                if (fallbackResult.choices && fallbackResult.choices.length > 0) {
                    const text = fallbackResult.choices[0].message.content || "Análise não disponível"
                    const quality = extractQuality(text)
                    return { text, quality }
                }
                throw new Error('Resposta vazia da IA no fallback')
            } catch (fallbackError) {
                console.error("Fallback failed:", fallbackError)
                throw fallbackError
            }
        }

        console.error("Erro ao chamar OpenAI:", error)
        throw new Error(`Erro na API: ${error.message || 'Desconhecido'}`)
    }
}
