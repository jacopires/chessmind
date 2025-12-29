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
        fen, // Reactive state
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
    const [legalMoves, setLegalMoves] = useState<Square[]>([])

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

    // State for stable pieces (prevents ID swapping during moves)
    const [pieces, setPieces] = useState<FloatingPiece[]>([])
    const lastFenRef = useRef<string>('')

    // Initialize/Sync Pieces
    useEffect(() => {
        const currentFen = game.fen()

        // Initial Load or Reset
        if (!lastFenRef.current || game.history().length === 0) {
            const board = game.board()
            const newPieces: FloatingPiece[] = []
            const counts: Record<string, number> = {}

            board.forEach((row, rankIdx) => {
                row.forEach((piece, fileIdx) => {
                    if (piece) {
                        const typeKey = `${piece.color}${piece.type}`
                        counts[typeKey] = (counts[typeKey] || 0) + 1

                        const file = String.fromCharCode(97 + fileIdx)
                        const rank = `${8 - rankIdx}`
                        const square = `${file}${rank}` as Square

                        newPieces.push({
                            square,
                            type: piece.type,
                            color: piece.color,
                            key: `${piece.color}${piece.type}-${counts[typeKey]}`
                        })
                    }
                })
            })
            setPieces(newPieces)
            lastFenRef.current = currentFen
            return
        }

        // Handle Move Updates (Differential logic)
        if (currentFen !== lastFenRef.current) {
            const history = game.history({ verbose: true })
            const lastMove = history[history.length - 1]

            if (lastMove) {
                setPieces(prev => {
                    const next = [...prev]

                    // Find moved piece
                    const pieceIndex = next.findIndex(p => p.square === lastMove.from)
                    if (pieceIndex !== -1) {
                        // Remove captured piece if any (at destination, or en-passant)
                        let captureSquare = lastMove.to
                        if (lastMove.flags.includes('e')) { // En Passant
                            const rankResult = parseInt(captureSquare[1]) + (lastMove.color === 'w' ? -1 : 1)
                            captureSquare = `${captureSquare[0]}${rankResult}` as Square
                        }

                        // Filter out captured pieces
                        const withoutCaptured = next.filter(p => p.square !== captureSquare)

                        // Update moved piece
                        const movedPiece = withoutCaptured.find(p => p.square === lastMove.from)
                        if (movedPiece) {
                            movedPiece.square = lastMove.to

                            // Handling Promotion
                            if (lastMove.promotion) {
                                movedPiece.type = lastMove.promotion as any
                                // Update key to reflect new identity? No, keep stable key for smooth transition
                                // Or maybe update image but keep ID? 
                                // Ideally we keep ID but ChessPiece component renders new type.
                                // Type is part of state, so it updates.
                            }

                            // Handling Castling
                            if (lastMove.flags.includes('k') || lastMove.flags.includes('q')) {
                                const rank = lastMove.color === 'w' ? '1' : '8'
                                let rookFrom: Square, rookTo: Square

                                if (lastMove.flags.includes('k')) { // Kingside
                                    rookFrom = `h${rank}` as Square
                                    rookTo = `f${rank}` as Square
                                } else { // Queenside
                                    rookFrom = `a${rank}` as Square
                                    rookTo = `d${rank}` as Square
                                }

                                const rook = withoutCaptured.find(p => p.square === rookFrom)
                                if (rook) rook.square = rookTo
                            }
                        }
                        return withoutCaptured
                    }

                    // Fallback: If differential fails (shouldn't happen), re-scan
                    return prev
                })
            }
            lastFenRef.current = currentFen
        }
    }, [fen, game])

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
                                                setLegalMoves([])
                                            } else {
                                                setSelectedSquare(null)
                                                setLegalMoves([])
                                            }
                                        } else if (piece && piece.color === game.turn()) {
                                            setSelectedSquare(square)
                                            const moves = game.moves({ square, verbose: true })
                                            setLegalMoves(moves.map(m => m.to))
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

                    {/* Legal move indicators (circles) */}
                    {/* Legal move indicators (circles) */}
                    {legalMoves.map((moveSquare) => {
                        const isCapture = game.get(moveSquare) !== null
                        const rankIdx = 7 - (moveSquare.charCodeAt(1) - '1'.charCodeAt(0))
                        const fileIdx = moveSquare.charCodeAt(0) - 'a'.charCodeAt(0)

                        // Fix for orientation
                        const orientation = userColor === 'black' ? 'b' : 'w'
                        const x = orientation === 'w' ? fileIdx : 7 - fileIdx
                        const y = orientation === 'w' ? rankIdx : 7 - rankIdx

                        return (
                            <div
                                key={`hint-${moveSquare}`}
                                className="absolute pointer-events-none flex items-center justify-center z-20"
                                style={{
                                    left: `${x * 12.5}%`,
                                    top: `${y * 12.5}%`,
                                    width: '12.5%',
                                    height: '12.5%'
                                }}
                            >
                                {isCapture ? (
                                    <div className="w-full h-full border-[6px] border-white/30 rounded-full" />
                                ) : (
                                    <div className="w-4 h-4 bg-white/20 rounded-full backdrop-blur-sm shadow-inner" />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Board Coordinates */}
                <div className="absolute top-0 right-0 bottom-0 pointer-events-none">
                    {ranks.map((rank, i) => (
                        <span key={rank}
                            className={`absolute right-1 text-[10px] font-bold ${(i + 7) % 2 === 0 ? 'text-slate-500' : 'text-slate-300'
                                }`}
                            style={{ top: `${i * 12.5 + 0.5}%` }}
                        >
                            {rank}
                        </span>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
                    {files.map((file, i) => (
                        <span key={file}
                            className={`absolute bottom-0.5 text-[10px] font-bold ${i % 2 === 0 ? 'text-slate-300' : 'text-slate-500'
                                }`}
                            style={{ left: `${i * 12.5 + 0.5}%` }}
                        >
                            {file}
                        </span>
                    ))}
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
                                    layoutId={piece.key} // Use stable ID for liquid animation
                                    initial={false}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 700, // Higher stiffness for snappier chess feel
                                        damping: 35,
                                        mass: 0.5
                                    }}
                                    drag={canDrag}
                                    dragSnapToOrigin={true} // IMPORTANT: Reverts if not handled
                                    dragElastic={0.1}
                                    dragMomentum={false}
                                    whileDrag={{
                                        scale: 1.1,
                                        zIndex: 100,
                                        cursor: 'grabbing',
                                        filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
                                    }}
                                    onDragStart={() => {
                                        setDraggedPiece(piece)
                                        setSelectedSquare(piece.square)
                                        // Calculate legal moves for dots
                                        const moves = game.moves({ square: piece.square, verbose: true })
                                        setLegalMoves(moves.map(m => m.to))
                                    }}
                                    onDragEnd={(_, info) => {
                                        const targetSquare = getSquareFromPointer(info.point)

                                        // Attempt move if dropped on different valid square
                                        if (targetSquare && targetSquare !== piece.square) {
                                            const moves = game.moves({ square: piece.square, verbose: true })
                                            const isLegal = moves.some(m => m.to === targetSquare)

                                            if (isLegal) {
                                                handleMove({ from: piece.square, to: targetSquare })
                                            }
                                        }

                                        // Cleanup
                                        setDraggedPiece(null)
                                        setLegalMoves([])
                                    }}
                                    style={{
                                        position: 'absolute',
                                        left: position.left,
                                        top: position.top,
                                        width: '12.5%',
                                        height: '12.5%',
                                        cursor: canDrag ? 'grab' : 'default',
                                        zIndex: isDragging ? 50 : 10, // Elevate dragged piece
                                        touchAction: 'none' // Prevent scrolling while dragging
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
