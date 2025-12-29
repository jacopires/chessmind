import { useEffect, useRef, useState, useCallback } from 'react'

export type StockfishInfo = {
    depth: number
    score: number // centipawns
    mate: number | null // moves to mate
    pv: string // principal variation (best line)
    bestMove: string
}

export function useStockfish() {
    const workerRef = useRef<Worker | null>(null)
    const [isReady, setIsReady] = useState(false)
    const [evaluation, setEvaluation] = useState<StockfishInfo | null>(null)
    const [bestMove, setBestMove] = useState<string | null>(null)

    useEffect(() => {
        // Initialize worker
        try {
            const worker = new Worker('/stockfish.js')
            workerRef.current = worker

            worker.onmessage = (event) => {
                const line = event.data
                // console.log('SF:', line)

                if (line === 'uciok') {
                    setIsReady(true)
                }
                if (line === 'readyok') {
                    setIsReady(true)
                }

                // Parse info lines for evaluation
                if (line.startsWith('info depth')) {
                    const depthMatch = line.match(/depth (\d+)/)
                    const scoreMatch = line.match(/score cp (-?\d+)/)
                    const mateMatch = line.match(/score mate (-?\d+)/)
                    const pvMatch = line.match(/ pv (.+)/)

                    if (depthMatch && (scoreMatch || mateMatch)) {
                        setEvaluation(prev => ({
                            ...prev,
                            depth: parseInt(depthMatch[1]),
                            score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
                            mate: mateMatch ? parseInt(mateMatch[1]) : null,
                            pv: pvMatch ? pvMatch[1] : (prev?.pv || ''),
                            bestMove: prev?.bestMove || ''
                        }))
                    }
                }

                // Capture best move
                if (line.startsWith('bestmove')) {
                    const move = line.split(' ')[1]
                    setBestMove(move)
                    setEvaluation(prev => prev ? { ...prev, bestMove: move } : null)
                }
            }

            worker.postMessage('uci')

        } catch (error) {
            console.error('Failed to load Stockfish:', error)
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate()
            }
        }
    }, [])

    const evaluatePosition = useCallback((fen: string, depth = 15) => {
        if (!workerRef.current) return
        setBestMove(null) // Reset best move on new position
        workerRef.current.postMessage(`position fen ${fen}`)
        workerRef.current.postMessage(`go depth ${depth}`)
    }, [])

    return { isReady, evaluation, bestMove, evaluatePosition }
}
