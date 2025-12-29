import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { type Square, type Move } from 'chess.js'
import { motion, AnimatePresence } from 'framer-motion'
import ChessPiece from '../components/ChessPiece'
import { AIOrb } from '../components/AIOrb'
import { FloatingFeedback } from '../components/FloatingFeedback'
import { AdvantageBar } from '../components/AdvantageBar'
import { ResignButton } from '../components/ResignButton'
import { useStockfish } from '../lib/stockfish'
import { analyzePosition, type MoveQuality } from '../lib/openai'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useGame } from '../lib/GameContext'

interface FloatingPiece {
    square: Square
    type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
    color: 'w' | 'b'
    key: string
}

export default function Game() {
    const { id: routeGameId } = useParams<{ id: string }>()
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const boardRef = useRef<HTMLDivElement>(null)

    // Game Context - SINGLE SOURCE OF TRUTH
    const {
        game,
        gameId,
        userColor,
        aiLevel,
        whiteTime,
        blackTime,
        gameInsights,
        moveQualityCounts,
        aiMentor,
        isActive,
        startNewGame,
        makeMove: contextMakeMove,
        endGame,
        updateTime,
        addInsight
    } = useGame()

    // Location state setup (only for NEW games)
    const locationState = location.state as any
    const {
        timeControl: initTimeControl = '10|0',
        color: initColor = 'white',
        aiMentor: initAiMentor = true,
        aiLevel: initAiLevel = 1
    } = locationState || {}

    // UI State (not game state)
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
    const [draggedPiece, setDraggedPiece] = useState<FloatingPiece | null>(null)
    const [showFloatingFeedback, setShowFloatingFeedback] = useState(false)
    const [currentFeedback, setCurrentFeedback] = useState('')
    const [aiOrbActive, setAiOrbActive] = useState(false)
    const [suggestedMove, setSuggestedMove] = useState<{ from: Square; to: Square } | null>(null)
    const [preMoveEval, setPreMoveEval] = useState<number | null>(null)
    const [preMoveBestMove, setPreMoveBestMove] = useState<string>('')

    // Stockfish Integration
    const { isReady, evaluation, bestMove, evaluatePosition } = useStockfish()

    // Initialize NEW game or resume existing
    useEffect(() => {
        if (isActive && gameId) {
            console.log('Resuming active game:', gameId)
            // Game already loaded from context
            return
        }

        // Start new game if coming from NewGame page
        if (locationState && !isActive) {
            const [minutes] = initTimeControl.split('|').map(Number)
            const initialTime = minutes * 60

            console.log('Starting new game:', {
                color: initColor,
                timeControl: initTimeControl,
                aiLevel: initAiLevel
            })

            startNewGame({
                gameId: routeGameId || `game-${Date.now()}`,
                color: initColor as 'white' | 'black',
                initialTime,
                timeControl: initTimeControl,
                aiMentor: initAiMentor,
                aiLevel: initAiLevel
            })
        }
    }, [])

    // Evaluate position when it changes
    useEffect(() => {
        if (!isReady || !isActive) return
        evaluatePosition(game.fen(), aiLevel)
    }, [game.fen(), isReady, isActive, aiLevel])

    // Timer tick
    useEffect(() => {
        if (!isActive) return

        const timer = setInterval(() => {
            const currentTurn = game.turn()
            if (currentTurn === 'w') {
                updateTime('white', Math.max(0, whiteTime - 1))
            } else {
                updateTime('black', Math.max(0, blackTime - 1))
            }
        }, 1000)

        if (game.isGameOver() || whiteTime === 0 || blackTime === 0) {
            clearInterval(timer)
        }

        return () => clearInterval(timer)
    }, [isActive, whiteTime, blackTime, game.fen()])

    // AI Move Logic
    useEffect(() => {
        if (!isActive || game.isGameOver()) return

        const currentTurn = game.turn()
        const isAITurn = (userColor === 'white' && currentTurn === 'b') ||
            (userColor === 'black' && currentTurn === 'w')

        if (isAITurn && bestMove) {
            const delay = setTimeout(() => {
                setAiOrbActive(true)

                setTimeout(() => {
                    const moveObj = {
                        from: bestMove.substring(0, 2) as Square,
                        to: bestMove.substring(2, 4) as Square,
                        promotion: bestMove.length > 4 ? 'q' : undefined
                    }

                    handleMove(moveObj)
                    setAiOrbActive(false)
                }, 300) // Reduced from 1000ms
            }, 300)

            return () => clearTimeout(delay)
        }
    }, [bestMove, game.fen(), userColor, isActive])

    // Extract floating pieces from FEN
    const pieces = useMemo((): FloatingPiece[] => {
        const board = game.board()
        const result: FloatingPiece[] = []

        board.forEach((row, rankIdx) => {
            row.forEach((piece, fileIdx) => {
                if (piece) {
                    const file = String.fromCharCode(97 + fileIdx)
                    const rank = `${8 - rankIdx}`
                    const square = `${file}${rank}` as Square

                    result.push({
                        square,
                        type: piece.type,
                        color: piece.color,
                        key: `${piece.color}${piece.type}${square}`
                    })
                }
            })
        })

        return result
    }, [game.fen()])

    // Helper: Square position
    const getSquarePosition = (square: Square, orientation: 'w' | 'b' = 'w') => {
        const file = square.charCodeAt(0) - 'a'.charCodeAt(0)
        const rank = '8'.charCodeAt(0) - square.charCodeAt(1)

        const x = orientation === 'w' ? file : 7 - file
        const y = orientation === 'w' ? rank : 7 - rank

        return {
            left: `${x * 12.5}%`,
            top: `${y * 12.5}%`
        }
    }

    // Helper: Get square from pointer
    const getSquareFromPointer = (point: { x: number; y: number }): Square | null => {
        const boardRect = boardRef.current?.getBoundingClientRect()
        if (!boardRect) return null

        const relX = point.x - boardRect.left
        const relY = point.y - boardRect.top

        const fileIdx = Math.floor((relX / boardRect.width) * 8)
        const rankIdx = Math.floor((relY / boardRect.height) * 8)

        const orientation = userColor === 'black' ? 'b' : 'w'
        const file = orientation === 'w' ? fileIdx : 7 - fileIdx
        const rank = orientation === 'w' ? 7 - rankIdx : rankIdx

        if (file >= 0 && file < 8 && rank >= 0 && rank < 8) {
            return `${String.fromCharCode(97 + file)}${rank + 1}` as Square
        }

        return null
    }

    // Handle move (with analysis)
    const handleMove = useCallback(async (move: { from: Square; to: Square; promotion?: string }) => {
        // Save pre-move evaluation
        if (evaluation) {
            setPreMoveEval(evaluation.score)
            setPreMoveBestMove(evaluation.bestMove)
        }

        const success = contextMakeMove(move as Move)
        if (!success) return false

        setSelectedSquare(null)
        setSuggestedMove(null)

        // AI Analysis (only for player moves)
        if (aiMentor && game.turn() !== (userColor === 'white' ? 'w' : 'b')) {
            setTimeout(async () => {
                setAiOrbActive(true)

                try {
                    const currentEval = evaluation?.score || 0
                    const diff = preMoveEval !== null ? currentEval - preMoveEval : 0

                    let quality: MoveQuality = 'Good'
                    if (Math.abs(diff) < 30) quality = 'Best'
                    else if (diff < -50) quality = 'Mistake'
                    else if (diff < -150) quality = 'Blunder'

                    const moveCount = game.history().length
                    const recentMoves = game.history().slice(-5)

                    const analysis = await analyzePosition({
                        fen: game.fen(),
                        move: game.history()[game.history().length - 1],
                        moveQuality: quality,
                        bestMove: preMoveBestMove,
                        evaluation: currentEval,
                        timeRemaining: userColor === 'white' ? whiteTime : blackTime,
                        recentMoves
                    })

                    setCurrentFeedback(analysis.text)
                    setShowFloatingFeedback(true)

                    // Add to context
                    addInsight({
                        moveNumber: moveCount,
                        move: game.history()[game.history().length - 1],
                        quality: analysis.quality,
                        feedback: analysis.text,
                        fen: game.fen(),
                        evaluation: currentEval
                    })

                    setTimeout(() => setShowFloatingFeedback(false), 5000)
                } catch (error) {
                    console.error('Analysis error:', error)
                } finally {
                    setAiOrbActive(false)
                }
            }, 500)
        }

        // Check game over
        if (game.isGameOver()) {
            await saveGameSnapshot()
        }

        return true
    }, [game, evaluation, preMoveEval, aiMentor, userColor, whiteTime, blackTime])

    // Save game snapshot
    const saveGameSnapshot = async (result?: string) => {
        if (!user) return

        let finalResult = result
        if (!finalResult) {
            if (game.isCheckmate()) {
                finalResult = game.turn() === 'w' ? '0-1' : '1-0'
            } else if (game.isDraw()) {
                finalResult = '1/2-1/2'
            } else if (whiteTime === 0) {
                finalResult = '0-1'
            } else if (blackTime === 0) {
                finalResult = '1-0'
            }
        }

        const analysisSummary = `Melhor: ${moveQualityCounts.best} | Bom: ${moveQualityCounts.good} | Erro: ${moveQualityCounts.mistake} | Blunder: ${moveQualityCounts.blunder}`

        await supabase.from('games').insert({
            user_id: user.id,
            pgn: game.pgn(),
            result: finalResult,
            analysis_summary: analysisSummary,
            insights: gameInsights,
            final_fen: game.fen()
        })

        endGame()
    }

    // Handle resign
    const handleResign = async () => {
        const result = userColor === 'white' ? '0-1' : '1-0'
        await saveGameSnapshot(result)
        navigate('/dashboard')
    }

    // Render board
    const renderBoard = () => {
        const files = userColor === 'black' ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'] : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        const ranks = userColor === 'black' ? ['1', '2', '3', '4', '5', '6', '7', '8'] : ['8', '7', '6', '5', '4', '3', '2', '1']

        return (
            <div ref={boardRef} className="relative aspect-square w-full max-w-2xl mx-auto">
                {/* Board Grid (empty cells) */}
                <div className="absolute inset-0 grid grid-cols-8 grid-rows-8">
                    {ranks.map((rank, rankIdx) =>
                        files.map((file, fileIdx) => {
                            const square = `${file}${rank}` as Square
                            const isLight = (rankIdx + fileIdx) % 2 === 0
                            const isSelected = selectedSquare === square

                            return (
                                <div
                                    key={square}
                                    onClick={() => {
                                        if (!isActive) return
                                        const piece = game.get(square)

                                        if (selectedSquare) {
                                            // Validate move is legal
                                            const moves = game.moves({ square: selectedSquare, verbose: true })
                                            const isLegal = moves.some(m => m.to === square)

                                            if (isLegal) {
                                                handleMove({ from: selectedSquare, to: square })
                                            } else {
                                                setSelectedSquare(null) // Clear selection on illegal move
                                            }
                                        } else if (piece && piece.color === game.turn()) {
                                            setSelectedSquare(square)
                                        }
                                    }}
                                    className={`
                                        ${isLight ? 'bg-slate-300' : 'bg-slate-600'}
                                        ${isSelected ? 'ring-4 ring-purple-500 ring-inset' : ''}
                                        cursor-pointer transition-all
                                    `}
                                />
                            )
                        })
                    )}
                </div>

                {/* Floating Pieces Layer */}
                <div className="absolute inset-0 pointer-events-none">
                    <AnimatePresence>
                        {pieces.map((piece) => {
                            const orientation = userColor === 'black' ? 'b' : 'w'
                            const position = getSquarePosition(piece.square, orientation)
                            const isDragging = draggedPiece?.key === piece.key
                            const canDrag = isActive && game.turn() === piece.color &&
                                ((userColor === 'white' && piece.color === 'w') ||
                                    (userColor === 'black' && piece.color === 'b'))

                            return (
                                <motion.div
                                    key={piece.key}
                                    layout={!isDragging}
                                    initial={false}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 300,
                                        damping: 30,
                                        mass: 0.8
                                    }}
                                    drag={canDrag}
                                    dragMomentum={false}
                                    dragElastic={0}
                                    whileDrag={{
                                        scale: 1.2,
                                        zIndex: 100,
                                        cursor: 'grabbing',
                                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                                    }}
                                    onDragStart={() => {
                                        setDraggedPiece(piece)
                                        setSelectedSquare(piece.square)
                                    }}
                                    onDragEnd={(_, info) => {
                                        const targetSquare = getSquareFromPointer(info.point)
                                        if (targetSquare && targetSquare !== piece.square) {
                                            // Validate move is legal
                                            const moves = game.moves({ square: piece.square, verbose: true })
                                            const isLegal = moves.some(m => m.to === targetSquare)
                                            if (isLegal) {
                                                handleMove({ from: piece.square, to: targetSquare })
                                            }
                                        }
                                        setDraggedPiece(null)
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: position.left,
                                        top: position.top,
                                        width: '12.5%',
                                        height: '12.5%',
                                        cursor: canDrag ? 'grab' : 'default',
                                        pointerEvents: 'auto'
                                    }}
                                >
                                    <ChessPiece type={piece.type} color={piece.color} />
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>

                {/* AI Highlights */}
                {suggestedMove && (
                    <>
                        {[suggestedMove.from, suggestedMove.to].map((square, idx) => {
                            const orientation = userColor === 'black' ? 'b' : 'w'
                            const position = getSquarePosition(square, orientation)

                            return (
                                <motion.div
                                    key={`highlight-${square}`}
                                    className="absolute pointer-events-none rounded-lg"
                                    style={{
                                        left: position.left,
                                        top: position.top,
                                        width: '12.5%',
                                        height: '12.5%'
                                    }}
                                    animate={{
                                        boxShadow: [
                                            '0 0 0 0 rgba(168, 85, 247, 0)',
                                            '0 0 0 8px rgba(168, 85, 247, 0.6)',
                                            '0 0 0 0 rgba(168, 85, 247, 0)'
                                        ]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 1.5,
                                        delay: idx * 0.75
                                    }}
                                />
                            )
                        })}
                    </>
                )}
            </div>
        )
    }

    // Time formatting
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex-1 flex justify-center items-center p-6">
            <FloatingFeedback
                message={currentFeedback}
                isVisible={showFloatingFeedback}
                onDismiss={() => setShowFloatingFeedback(false)}
            />

            <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                {/* Left: AI Orb + Advantage */}
                <div className="flex flex-col items-center gap-4">
                    <AIOrb isActive={aiOrbActive} />
                    <AdvantageBar evaluation={evaluation?.score || 0} />
                </div>

                {/* Center: Board + Controls */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Opponent Timer */}
                    <div className="glass-strong rounded-xl p-4 flex justify-between items-center">
                        <span className="text-lg font-bold">
                            {userColor === 'white' ? 'Aristóteles' : 'Você'}
                        </span>
                        <span className="text-2xl font-mono">
                            {formatTime(userColor === 'white' ? blackTime : whiteTime)}
                        </span>
                    </div>

                    {/* Board */}
                    {renderBoard()}

                    {/* Player Timer */}
                    <div className="glass-strong rounded-xl p-4 flex justify-between items-center">
                        <span className="text-lg font-bold">
                            {userColor === 'white' ? 'Você' : 'Aristóteles'}
                        </span>
                        <span className="text-2xl font-mono">
                            {formatTime(userColor === 'white' ? whiteTime : blackTime)}
                        </span>
                    </div>
                </div>

                {/* Right: Game Info */}
                <div className="w-64 space-y-4">
                    <div className="glass-strong rounded-xl p-4">
                        <h3 className="text-sm font-bold opacity-60 mb-2">ESTATÍSTICAS</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Melhor</span>
                                <span className="text-green-400">{moveQualityCounts.best}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Bom</span>
                                <span className="text-blue-400">{moveQualityCounts.good}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Erro</span>
                                <span className="text-yellow-400">{moveQualityCounts.mistake}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Blunder</span>
                                <span className="text-red-400">{moveQualityCounts.blunder}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resign Button */}
            {isActive && <ResignButton onResign={handleResign} />}
        </div>
    )
}
