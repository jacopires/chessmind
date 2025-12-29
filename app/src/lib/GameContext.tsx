import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { Chess, type Move } from 'chess.js'
import { type MoveQuality } from './openai'

interface GameInsight {
    moveNumber: number
    move: string
    quality: MoveQuality
    feedback: string
    fen: string
    evaluation: number
}

interface NewGameConfig {
    gameId: string
    color: 'white' | 'black'
    initialTime: number
    timeControl: string
    aiMentor: boolean
    aiLevel: number
}

interface GameState {
    gameId: string | null
    game: Chess
    fen: string
    userColor: 'white' | 'black'
    aiLevel: number
    whiteTime: number
    blackTime: number
    gameInsights: GameInsight[]
    moveQualityCounts: {
        best: number
        good: number
        mistake: number
        blunder: number
    }
    aiMentor: boolean
    isActive: boolean
    timeControl: string
}

interface GameContextType extends GameState {
    startNewGame: (config: NewGameConfig) => void
    makeMove: (move: Move) => boolean
    resign: () => Promise<void>
    endGame: () => void
    updateTime: (color: 'white' | 'black', time: number) => void
    addInsight: (insight: GameInsight) => void
    resetGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export function GameProvider({ children }: { children: ReactNode }) {
    const [gameId, setGameId] = useState<string | null>(null)
    const [game] = useState(new Chess())
    const [fen, setFen] = useState(game.fen()) // Reactive FEN
    const [userColor, setUserColor] = useState<'white' | 'black'>('white')
    const [aiLevel, setAiLevel] = useState(1)
    const [whiteTime, setWhiteTime] = useState(600)
    const [blackTime, setBlackTime] = useState(600)
    const [gameInsights, setGameInsights] = useState<GameInsight[]>([])
    const [moveQualityCounts, setMoveQualityCounts] = useState({
        best: 0, good: 0, mistake: 0, blunder: 0
    })
    const [aiMentor, setAiMentor] = useState(true)
    const [isActive, setIsActive] = useState(false)
    const [timeControl, setTimeControl] = useState('10|0')

    const startNewGame = useCallback((config: NewGameConfig) => {
        game.reset()
        setFen(game.fen())
        setGameId(config.gameId)
        setUserColor(config.color)
        setAiLevel(config.aiLevel)
        setWhiteTime(config.initialTime)
        setBlackTime(config.initialTime)
        setGameInsights([])
        setMoveQualityCounts({ best: 0, good: 0, mistake: 0, blunder: 0 })
        setAiMentor(config.aiMentor)
        setIsActive(true)
        setTimeControl(config.timeControl)
    }, [game])

    const makeMove = useCallback((move: Move) => {
        try {
            const result = game.move(move)
            if (result) {
                setFen(game.fen()) // Update FEN to trigger re-renders
                return true
            }
            return false
        } catch (e) {
            return false
        }
    }, [game])

    const resign = useCallback(async () => {
        setIsActive(false)
        // Game will be saved by Game.tsx component
    }, [])

    const endGame = useCallback(() => {
        setIsActive(false)
        // Don't clear gameId immediately - let save happen first
        setTimeout(() => {
            setGameId(null)
        }, 1000)
    }, [])

    const updateTime = useCallback((color: 'white' | 'black', time: number) => {
        if (color === 'white') {
            setWhiteTime(time)
        } else {
            setBlackTime(time)
        }
    }, [])

    const addInsight = useCallback((insight: GameInsight) => {
        setGameInsights(prev => [...prev, insight])
        const qualityKey = insight.quality.toLowerCase() as keyof typeof moveQualityCounts
        setMoveQualityCounts(prev => ({
            ...prev,
            [qualityKey]: prev[qualityKey] + 1
        }))
    }, [])

    const resetGame = useCallback(() => {
        game.reset()
        setGameId(null)
        setGameInsights([])
        setMoveQualityCounts({ best: 0, good: 0, mistake: 0, blunder: 0 })
        setIsActive(false)
    }, [game])

    const value: GameContextType = {
        gameId,
        game,
        fen,
        userColor,
        aiLevel,
        whiteTime,
        blackTime,
        gameInsights,
        moveQualityCounts,
        aiMentor,
        isActive,
        timeControl,
        startNewGame,
        makeMove,
        resign,
        endGame,
        updateTime,
        addInsight,
        resetGame
    }

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    )
}

export const useGame = () => {
    const context = useContext(GameContext)
    if (!context) {
        throw new Error('useGame must be used within GameProvider')
    }
    return context
}
