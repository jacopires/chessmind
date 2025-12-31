import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { type Square, type Move } from 'chess.js'
import { motion } from 'framer-motion'
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
    const [disableLayout, setDisableLayout] = useState(false)

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

            // Generate fresh state from board
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

        // Handle Move Updates (Reconciliation Logic)
        if (currentFen !== lastFenRef.current) {
            const history = game.history({ verbose: true })
            const lastMove = history[history.length - 1]

            if (lastMove) {
                setPieces(prev => {
                    const board = game.board()
                    const nextPieces: FloatingPiece[] = []
                    const usedIds = new Set<string>()

                    // Helper to find and claim a piece from previous state
                    const claimPiece = (searchSquare: Square, type: string, color: string): string | null => {
                        const match = prev.find(p =>
                            p.square === searchSquare &&
                            // Allow type change for promotion (pawn becomes queen)
                            (p.type === type || (p.type === 'p' && ['q', 'r', 'b', 'n'].includes(type))) &&
                            p.color === color &&
                            !usedIds.has(p.key)
                        )
                        if (match) {
                            usedIds.add(match.key)
                            return match.key
                        }
                        return null
                    }

                    // 1. Process Movers (Priority to preserve animation)

                    // Identify Primary Move (From -> To)
                    // If castling, we handle king here.
                    const isCastling = lastMove.flags.includes('k') || lastMove.flags.includes('q')

                    // Generate list of squares to process specifically as "moved"
                    const movedMappings: { from: Square, to: Square }[] = [
                        { from: lastMove.from, to: lastMove.to }
                    ]

                    if (isCastling) {
                        const rank = lastMove.color === 'w' ? '1' : '8'
                        if (lastMove.flags.includes('k')) { // Kingside
                            movedMappings.push({ from: `h${rank}` as Square, to: `f${rank}` as Square })
                        } else { // Queenside
                            movedMappings.push({ from: `a${rank}` as Square, to: `d${rank}` as Square })
                        }
                    }

                    // 2. Scan current board and map to previous IDs
                    // 2. Scan current board and map to previous IDs

                    board.forEach((row, rankIdx) => {
                        row.forEach((piece, fileIdx) => {
                            if (piece) {
                                const file = String.fromCharCode(97 + fileIdx)
                                const rank = `${8 - rankIdx}`
                                const square = `${file}${rank}` as Square

                                let key: string | null = null

                                // Check if this piece is a "Mover" (arrived at 'to' from 'from')
                                const moveMap = movedMappings.find(m => m.to === square)
                                if (moveMap) {
                                    // Try to claim the piece that was at 'from'
                                    key = claimPiece(moveMap.from, piece.type, piece.color)
                                }

                                // If not a mover (or claim failed), try to match Stationary piece (same square)
                                if (!key) {
                                    key = claimPiece(square, piece.type, piece.color)
                                }

                                // Fallback: Generate new ID (Animation will pop, but state is consistent)
                                if (!key) {
                                    // We need to ensure we don't collide with existing keys in 'nextPieces'
                                    // But since we are building nextPieces from scratch, collision risk is vs 'usedIds'? 
                                    // To be safe, we might use a timestamp or random, but consistent naming is better.
                                    // For now, let's assume we won't need many fallbacks.
                                    key = `${piece.color}${piece.type}-new-${Date.now()}-${Math.random()}`
                                }

                                nextPieces.push({
                                    square,
                                    type: piece.type,
                                    color: piece.color,
                                    key
                                })
                            }
                        })
                    })

                    return nextPieces
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
            <div ref={boardRef} className="relative w-full h-full">
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
                                                setSelectedSquare(null)
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

                    {/* Legal move indicators (circles) - Chess.com style */}
                    {legalMoves.map((moveSquare) => {
                        const isCapture = game.get(moveSquare) !== null
                        const rankIdx = 7 - (moveSquare.charCodeAt(1) - '1'.charCodeAt(0))
                        const fileIdx = moveSquare.charCodeAt(0) - 'a'.charCodeAt(0)

                        // Fix for orientation
                        const orientation = userColor === 'black' ? 'b' : 'w'
                        const x = orientation === 'w' ? fileIdx : 7 - fileIdx
                        const y = orientation === 'w' ? rankIdx : 7 - rankIdx

                        // Determine if square is light or dark for dot contrast
                        const isLightSquare = (x + y) % 2 === 0

                        return (
                            <div
                                key={`hint-${moveSquare}`}
                                className="absolute pointer-events-none flex items-center justify-center z-[5]"
                                style={{
                                    left: `${x * 12.5}%`,
                                    top: `${y * 12.5}%`,
                                    width: '12.5%',
                                    height: '12.5%'
                                }}
                            >
                                {isCapture ? (
                                    <div className={`w-full h-full border-[6px] ${isLightSquare ? 'border-black/20' : 'border-white/20'} rounded-full`} />
                                ) : (
                                    <div className={`w-[30%] h-[30%] ${isLightSquare ? 'bg-black/20' : 'bg-white/20'} rounded-full`} />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Board Coordinates - Subtle opacity */}
                <div className="absolute top-0 right-0 bottom-0 pointer-events-none opacity-30">
                    {ranks.map((rank, i) => (
                        <span key={rank}
                            className={`absolute right-1 text-[10px] font-bold ${(i + 7) % 2 === 0 ? 'text-slate-600' : 'text-slate-400'}`}
                            style={{ top: `${i * 12.5 + 0.5}%` }}
                        >
                            {rank}
                        </span>
                    ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 pointer-events-none opacity-30">
                    {files.map((file, i) => (
                        <span key={file}
                            className={`absolute bottom-0.5 text-[10px] font-bold ${i % 2 === 0 ? 'text-slate-400' : 'text-slate-600'}`}
                            style={{ left: `${i * 12.5 + 0.5}%` }}
                        >
                            {file}
                        </span>
                    ))}
                </div>

                {/* Floating Pieces Layer */}
                <div className="absolute inset-0 pointer-events-none">
                    {pieces.map((piece) => {
                        const orientation = userColor === 'black' ? 'b' : 'w'
                        const position = getSquarePosition(piece.square, orientation)
                        const isDragging = draggedPiece?.key === piece.key
                        const canDrag = isActive && game.turn() === piece.color &&
                            ((userColor === 'white' && piece.color === 'w') ||
                                (userColor === 'black' && piece.color === 'b'))

                        return (
                            <div key={piece.key}>

                                {/* Draggable piece - ZERO tremor */}
                                <motion.div
                                    key={piece.key}
                                    layoutId={piece.key}
                                    layout={!disableLayout && !isDragging}
                                    initial={false}
                                    drag={canDrag}
                                    dragConstraints={boardRef}
                                    dragElastic={0}
                                    dragMomentum={false}
                                    dragSnapToOrigin={true}
                                    dragTransition={{
                                        power: 0,
                                        timeConstant: 150
                                    }}
                                    transition={{
                                        layout: {
                                            type: 'spring',
                                            stiffness: 1500,
                                            damping: 80,
                                            mass: 0.5
                                        }
                                    }}
                                    whileDrag={{
                                        scale: 1.15,
                                        zIndex: 50,
                                        cursor: 'grabbing',
                                        filter: 'drop-shadow(0 25px 20px rgba(0,0,0,0.4))'
                                    }}
                                    whileHover={!isDragging ? {
                                        scale: 1.05,
                                        filter: 'drop-shadow(0 8px 8px rgba(0,0,0,0.3))'
                                    } : undefined}
                                    onDragStart={() => {
                                        setDisableLayout(true)
                                        setDraggedPiece(piece)
                                        setSelectedSquare(piece.square)
                                        const moves = game.moves({ square: piece.square, verbose: true })
                                        setLegalMoves(moves.map(m => m.to))
                                    }}
                                    onDragEnd={(_, info) => {
                                        const boardRect = boardRef.current?.getBoundingClientRect()

                                        if (boardRect) {
                                            const x = info.point.x
                                            const y = info.point.y

                                            const relX = x - boardRect.left
                                            const relY = y - boardRect.top

                                            const colIdx = Math.floor((relX / boardRect.width) * 8)
                                            const rowIdx = Math.floor((relY / boardRect.height) * 8)

                                            if (colIdx >= 0 && colIdx < 8 && rowIdx >= 0 && rowIdx < 8) {
                                                const file = orientation === 'w' ? colIdx : 7 - colIdx
                                                const rank = orientation === 'w' ? 7 - rowIdx : rowIdx
                                                const targetSquare = `${String.fromCharCode(97 + file)}${rank + 1}` as Square

                                                if (targetSquare !== piece.square) {
                                                    const moves = game.moves({ square: piece.square, verbose: true })
                                                    const isLegal = moves.some(m => m.to === targetSquare)

                                                    if (isLegal) {
                                                        // Valid move - instant lock (disable layout to prevent tremor)
                                                        setDisableLayout(true)
                                                        handleMove({ from: piece.square, to: targetSquare })
                                                        setLegalMoves([])
                                                        setSelectedSquare(null)
                                                        setDraggedPiece(null)
                                                        // Re-enable layout after one frame
                                                        requestAnimationFrame(() => setDisableLayout(false))
                                                        return // Exit early - no spring back animation
                                                    }
                                                }
                                            }
                                        }

                                        // Invalid move - spring back
                                        setDraggedPiece(null)
                                        requestAnimationFrame(() => setDisableLayout(false))
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (!isActive) return

                                        // Capture on enemy piece
                                        if (selectedSquare && selectedSquare !== piece.square) {
                                            const moves = game.moves({ square: selectedSquare, verbose: true })
                                            const isLegal = moves.some(m => m.to === piece.square)

                                            if (isLegal) {
                                                handleMove({ from: selectedSquare, to: piece.square })
                                                setLegalMoves([])
                                                setSelectedSquare(null)
                                                return
                                            }
                                        }

                                        // Select own piece
                                        if (piece.color === game.turn() && canDrag) {
                                            setSelectedSquare(piece.square)
                                            const moves = game.moves({ square: piece.square, verbose: true })
                                            setLegalMoves(moves.map(m => m.to))
                                        }
                                    }}
                                    className="absolute pointer-events-auto select-none"
                                    style={{
                                        left: position.left,
                                        top: position.top,
                                        width: '12.5%',
                                        height: '12.5%',
                                        zIndex: isDragging ? 50 : 10,
                                        cursor: canDrag ? 'grab' : 'default',
                                        touchAction: 'none',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                >
                                    <ChessPiece type={piece.type} color={piece.color} />
                                </motion.div>
                            </div>
                        )
                    })}
                </div>

                {/* AI Highlights - Soft Purple Flash */}
                {suggestedMove && (
                    <>
                        {[suggestedMove.from, suggestedMove.to].map((square, idx) => {
                            const orientation = userColor === 'black' ? 'b' : 'w'
                            const position = getSquarePosition(square, orientation)

                            return (
                                <motion.div
                                    key={`highlight-${square}`}
                                    className="absolute pointer-events-none rounded-sm"
                                    style={{
                                        left: position.left,
                                        top: position.top,
                                        width: '12.5%',
                                        height: '12.5%'
                                    }}
                                    initial={{ backgroundColor: 'rgba(168, 85, 247, 0)' }}
                                    animate={{
                                        backgroundColor: [
                                            'rgba(168, 85, 247, 0)',
                                            'rgba(168, 85, 247, 0.4)',
                                            'rgba(168, 85, 247, 0)'
                                        ]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2,
                                        ease: 'easeInOut',
                                        delay: idx * 0.5
                                    }}
                                />
                            )
                        })}
                    </>
                )}
                {/* Advantage Bar - Absolute Positioned (Left) */}
                <div className="absolute top-0 bottom-0 -left-6 w-2 hidden lg:block z-0">
                    <AdvantageBar evaluation={evaluation?.score || 0} />
                </div>
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
        <div className="h-[calc(100vh-4rem)] flex justify-center items-center p-4 overflow-hidden">
            <FloatingFeedback
                message={currentFeedback}
                isVisible={showFloatingFeedback}
                onDismiss={() => setShowFloatingFeedback(false)}
            />

            <div className="flex gap-4 items-center h-full">
                {/* Left: AI Orb */}
                <div className="hidden lg:flex flex-col items-center justify-center">
                    <AIOrb isActive={aiOrbActive} />
                </div>

                {/* Center: Board with timers */}
                <div className="flex flex-col h-full justify-center">
                    {/* Opponent Timer */}
                    <div className="flex justify-between items-center mb-2 w-full">
                        <span className="text-sm font-semibold text-white/80">
                            {userColor === 'white' ? 'Aristóteles' : 'Você'}
                        </span>
                        <span className="text-lg font-mono font-bold bg-slate-700/80 px-3 py-1 rounded">
                            {formatTime(userColor === 'white' ? blackTime : whiteTime)}
                        </span>
                    </div>

                    {/* Board - takes remaining height */}
                    <div className="flex-shrink-0" style={{ width: 'min(70vh, 600px)', height: 'min(70vh, 600px)' }}>
                        {renderBoard()}
                    </div>

                    {/* Player Timer */}
                    <div className="flex justify-between items-center mt-2 w-full">
                        <span className="text-sm font-semibold text-white/80">
                            {userColor === 'white' ? 'Você' : 'Aristóteles'}
                        </span>
                        <span className="text-lg font-mono font-bold bg-purple-600/80 px-3 py-1 rounded">
                            {formatTime(userColor === 'white' ? whiteTime : blackTime)}
                        </span>
                    </div>
                </div>

                {/* Right: Statistics */}
                <div className="hidden lg:block w-48 self-center">
                    <div className="glass-strong rounded-lg p-3">
                        <h3 className="text-xs font-bold opacity-60 mb-2">ESTATÍSTICAS</h3>
                        <div className="space-y-1 text-xs">
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
