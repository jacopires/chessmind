import { useState, useEffect, useCallback } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { Chess, type Square } from 'chess.js'
import { motion } from 'framer-motion'
import ChessPiece from '../components/ChessPiece'
import { AnimatedOrbs } from '../components/AnimatedOrbs'
import { AIOrb } from '../components/AIOrb'
import { FloatingFeedback } from '../components/FloatingFeedback'
import { useStockfish } from '../lib/stockfish'
import { analyzePosition } from '../lib/openai'

type Arrow = {
    from: Square
    to: Square
    color: string
}

export default function Game() {
    const { gameId } = useParams()
    useEffect(() => {
        if (gameId) console.log('Game ID:', gameId)
    }, [gameId])
    const location = useLocation()
    const { timeControl, color: userColor, aiMentor: initialAiMentor } = location.state || { timeControl: '10|0', color: 'white', aiMentor: true }

    // Time Control Parsing
    const initialTime = timeControl && timeControl.includes('|') ? parseInt(timeControl.split('|')[0]) * 60 : 600
    const initialIncrement = timeControl && timeControl.includes('|') ? parseInt(timeControl.split('|')[1]) : 0

    const [game, setGame] = useState(new Chess())
    const [boardOrientation, setBoardOrientation] = useState<'w' | 'b'>('w')

    // Game State
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
    const [lastMoveSan, setLastMoveSan] = useState<string>('')
    const [activeColor, setActiveColor] = useState<'w' | 'b'>('w')

    // Time State
    const [whiteTime, setWhiteTime] = useState(initialTime)
    const [blackTime, setBlackTime] = useState(initialTime)

    // AI/Analysis State
    const [aiMentor] = useState(initialAiMentor)
    const [hasAnalyzed, setHasAnalyzed] = useState(false)
    const [preMoveScore, setPreMoveScore] = useState<number | null>(null)
    const [preMoveBestMove, setPreMoveBestMove] = useState<string>('')

    // Antigravity UI State
    const [showFloatingFeedback, setShowFloatingFeedback] = useState(false)
    const [currentFeedback, setCurrentFeedback] = useState('')
    const [aiOrbActive, setAiOrbActive] = useState(false)

    // Stockfish Integration
    const { isReady, evaluation, bestMove, evaluatePosition } = useStockfish()

    // Arrow & Drag State
    const [arrows, setArrows] = useState<Arrow[]>([])
    const [rightClickStart, setRightClickStart] = useState<Square | null>(null)
    const [draggedSquare, setDraggedSquare] = useState<Square | null>(null)

    // Set board orientation based on resolved color
    useEffect(() => {
        if (userColor === 'black') {
            setBoardOrientation('b')
        } else {
            setBoardOrientation('w')
        }
    }, [userColor]);

    // Update evaluation when position changes
    useEffect(() => {
        if (!isReady) return
        evaluatePosition(game.fen())
    }, [game, isReady, evaluatePosition])

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            if (activeColor === 'w') setWhiteTime(prev => Math.max(0, prev - 1))
            else setBlackTime(prev => Math.max(0, prev - 1))
        }, 1000)
        if (game.isGameOver()) clearInterval(timer)
        return () => clearInterval(timer)
    }, [activeColor, game])

    // Update active color on move
    useEffect(() => {
        setActiveColor(game.turn())
    }, [game])


    // Make Move
    const makeMove = useCallback((move: { from: string, to: string, promotion?: string }) => {
        try {
            const gameCopy = new Chess(game.fen())
            // Validate Logic for user (manual) or ai
            // If manual, it might be partial string? No, chess.js handles it.

            const result = gameCopy.move(move)

            if (result) {
                // Determine quality vars before update (snapshotting current eval for opponent - which was player)
                // Wait, quality is calculated for the moved piece.
                // If I am White, I move. My score was +50.
                if (evaluation) {
                    setPreMoveScore(evaluation.score)
                    setPreMoveBestMove(evaluation.bestMove)
                }

                setGame(gameCopy)
                setLastMoveSan(result.san)
                setSelectedSquare(null)
                setArrows([]) // Clear arrows on move
                setHasAnalyzed(false) // Reset analysis trigger

                // Add increment
                const movedColor = result.color
                if (movedColor === 'w') setWhiteTime(prev => prev + initialIncrement)
                else setBlackTime(prev => prev + initialIncrement)

                // Check game over
                if (gameCopy.isGameOver()) {
                    // Game over logic (can be added back if state is restored)
                }
                return true
            }
        } catch (e) {
            return false
        }
        return false
    }, [game, evaluation, initialIncrement])


    // Auto-Play Logic (Stockfish Opponent)
    useEffect(() => {
        if (!isReady || game.isGameOver()) return

        const isPlayerTurn = game.turn() === (userColor === 'black' ? 'b' : 'w')

        // If it's NOT player's turn, it's Computer's turn.
        if (!isPlayerTurn && bestMove) {
            console.log("SF Best Move Trigger (Delayed):", bestMove)
            const from = bestMove.substring(0, 2)
            const to = bestMove.substring(2, 4)
            const promotion = bestMove.length === 5 ? bestMove[4] : 'q'

            // Humanize Delay (e.g., 2.5s - 4.5s)
            // This gives time for Mentor to "react" first if analysis is fast enough.
            const humanDelay = Math.floor(Math.random() * 2000) + 2500

            const timer = setTimeout(() => {
                makeMove({ from, to, promotion })
            }, humanDelay)

            return () => clearTimeout(timer)
        }
    }, [bestMove, game, userColor, isReady, makeMove])

    // Auto-Analysis (Mentor)
    useEffect(() => {
        const isPlayerTurn = game.turn() === (userColor === 'black' ? 'b' : 'w')

        // Analyze AFTER the player moves (now it's opponent's turn)
        if (!isPlayerTurn && !hasAnalyzed && aiMentor && evaluation && evaluation.depth >= 10) {
            setHasAnalyzed(true)

            // Calculate Quality
            const currentScorePerspective = -1 * evaluation.score
            const delta = currentScorePerspective - (preMoveScore ?? 0)

            let quality: 'Best' | 'Good' | 'Mistake' | 'Blunder' = 'Good'
            if (lastMoveSan.includes('#')) quality = 'Best'
            else if (lastMoveSan === preMoveBestMove) quality = 'Best'
            else if (delta > -30) quality = 'Good'
            else if (delta > -100) quality = 'Mistake'
            else quality = 'Blunder'

            setAiOrbActive(true)
            analyzePosition({
                fen: game.fen(),
                pgn: game.pgn(),
                move: lastMoveSan,
                moveQuality: quality,
                bestMove: preMoveBestMove
            }).then(analysis => {
                setCurrentFeedback(analysis)
                setShowFloatingFeedback(true)
                setAiOrbActive(false)
            }).catch(err => {
                console.error(err)
                setAiOrbActive(false)
            })
        }
    }, [evaluation, game, userColor, aiMentor, hasAnalyzed, preMoveScore, preMoveBestMove, lastMoveSan])


    // Handlers
    const handleSquareClick = (square: Square) => {
        const isPlayerTurn = game.turn() === (userColor === 'black' ? 'b' : 'w')
        if (!isPlayerTurn) return

        if (selectedSquare === square) {
            setSelectedSquare(null)
            return
        }

        if (selectedSquare) {
            const success = makeMove({ from: selectedSquare, to: square, promotion: 'q' })
            if (!success) {
                const piece = game.get(square)
                if (piece && piece.color === game.turn()) {
                    setSelectedSquare(square)
                } else {
                    setSelectedSquare(null)
                }
            }
        } else {
            const piece = game.get(square)
            if (piece && piece.color === game.turn()) {
                setSelectedSquare(square)
            }
        }
    }

    // Drag & Drop Handlers
    const handleDragStart = (e: React.DragEvent, square: Square) => {
        const isPlayerTurn = game.turn() === (userColor === 'black' ? 'b' : 'w')
        if (!isPlayerTurn) {
            e.preventDefault()
            return
        }

        const piece = game.get(square)
        if (!piece || piece.color !== game.turn()) {
            e.preventDefault()
            return
        }

        setDraggedSquare(square)
        e.dataTransfer.effectAllowed = 'move'
        // Create ghost image properly if needed, but default is usually ok for now
    }

    const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
        e.preventDefault()
        if (draggedSquare) {
            makeMove({ from: draggedSquare, to: targetSquare, promotion: 'q' })
            setDraggedSquare(null)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    // Right Click Arrows
    const handleMouseDown = (e: React.MouseEvent, square: Square) => {
        if (e.button === 2) { // Right click
            setRightClickStart(square)
        }
    }

    const handleMouseUp = (e: React.MouseEvent, square: Square) => {
        if (e.button === 2 && rightClickStart) {
            if (rightClickStart !== square) {
                // Draw arrow
                setArrows(prev => {
                    const existing = prev.find(a => a.from === rightClickStart && a.to === square)
                    if (existing) return prev.filter(a => a !== existing) // Toggle off
                    return [...prev, { from: rightClickStart, to: square, color: '#fda429' }] // Add new
                })
            }
            setRightClickStart(null)
        } else if (e.button === 0) {
            // Left click clears arrows
            setArrows([])
        }
    }

    // SVG Arrow Rendering Helper
    const getSquareCenter = (square: Square) => {
        const file = square.charCodeAt(0) - 97
        const rank = 8 - parseInt(square[1])
        // Adjust for Board Orientation
        const col = boardOrientation === 'w' ? file : 7 - file
        const row = boardOrientation === 'w' ? rank : 7 - rank

        return { x: col * 12.5 + 6.25, y: row * 12.5 + 6.25 } // % coordinates
    }

    const renderArrows = () => {
        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                <defs>
                    <marker id="arrowhead" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                        <polygon points="0 0, 4 2, 0 4" fill="#fda429" opacity="0.8" />
                    </marker>
                </defs>
                {arrows.map((arrow, i) => {
                    const start = getSquareCenter(arrow.from)
                    const end = getSquareCenter(arrow.to)
                    return (
                        <line
                            key={i}
                            x1={`${start.x}%`} y1={`${start.y}%`}
                            x2={`${end.x}%`} y2={`${end.y}%`}
                            stroke="#fda429" strokeWidth="1.5" strokeOpacity="0.8"
                            markerEnd="url(#arrowhead)"
                        />
                    )
                })}
            </svg>
        )
    }

    const renderBoard = () => {
        const board = []
        const boardState = game.board()

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                // Adjust row/col based on board orientation
                const displayRow = boardOrientation === 'w' ? row : 7 - row
                const displayCol = boardOrientation === 'w' ? col : 7 - col

                const isWhiteSquare = (displayRow + displayCol) % 2 === 0
                const piece = boardState[displayRow][displayCol]
                const squareName = String.fromCharCode(97 + displayCol) + (8 - displayRow) as Square

                const isSelected = selectedSquare === squareName

                // Highlight last move
                const isLastMoveFrom = lastMoveSan && game.history({ verbose: true }).length > 0 && game.history({ verbose: true }).slice(-1)[0].from === squareName
                const isLastMoveTo = lastMoveSan && game.history({ verbose: true }).length > 0 && game.history({ verbose: true }).slice(-1)[0].to === squareName

                let rankLabel = null
                let fileLabel = null

                if (col === 0) rankLabel = <span className={`absolute top-0.5 left-0.5 text-[10px] font-bold font-sans ${isWhiteSquare ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>{8 - displayRow}</span>
                if (row === 7) fileLabel = <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold font-sans ${isWhiteSquare ? 'text-[#779556]' : 'text-[#ebecd0]'}`}>{String.fromCharCode(97 + displayCol)}</span>

                board.push(
                    <div
                        key={`${displayRow}-${displayCol}`}
                        onMouseDown={(e) => handleMouseDown(e, squareName)}
                        onMouseUp={(e) => handleMouseUp(e, squareName)}
                        onClick={() => handleSquareClick(squareName)}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, squareName)}
                        className={`
                            ${isWhiteSquare ? 'bg-white/10' : 'bg-white/3'} 
                            ${isSelected ? 'ring-ambient-active' : ''} 
                            ${(isLastMoveFrom || isLastMoveTo) ? 'bg-purple-500/20 shadow-ambient' : ''}
                            flex items-center justify-center relative text-5xl sm:text-6xl lg:text-7xl select-none
                            transition-all duration-200
                        `}
                    >
                        {rankLabel}
                        {fileLabel}

                        {/* Render Piece */}
                        {piece && (
                            <div
                                className="w-[80%] h-[80%] flex items-center justify-center cursor-grab active:cursor-grabbing relative"
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, squareName)}
                            >
                                {isSelected && (
                                    <div className="absolute inset-0 rounded-full bg-purple-500/8 blur-lg" />
                                )}
                                <ChessPiece type={piece.type} color={piece.color} />
                            </div>
                        )}
                    </div>
                )
            }
        }
        return board
    }

    return (
        <div className="bg-slate-950 font-display text-white h-screen flex overflow-hidden relative">
            {/* Animated Background Orbs - The Void */}
            <AnimatedOrbs />

            {/* Left Sidebar (Navigation) - Glass Morphism */}
            <aside className="w-20 lg:w-64 glass border-r border-white/10 flex flex-col shrink-0 z-20 relative">
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/10">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="size-10 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark rounded-xl text-white shadow-ambient group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-xl">smart_toy</span>
                        </div>
                        <h2 className="hidden lg:block text-white text-lg font-bold leading-tight tracking-tight">ChessMind</h2>
                    </Link>
                </div>

                <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
                    <Link to="/new-game" className="flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                        <span className="material-symbols-outlined group-hover:text-primary transition-colors">dashboard</span>
                        <span className="hidden lg:block font-medium text-sm">Dashboard</span>
                    </Link>
                    <Link to="/new-game" className="flex items-center gap-3 px-3 py-3 bg-purple-500/10 text-primary-light rounded-xl ring-ambient shadow-ambient">
                        <span className="material-symbols-outlined">sports_esports</span>
                        <span className="hidden lg:block font-bold text-sm">Jogar</span>
                    </Link>
                    <Link to="#" className="flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                        <span className="material-symbols-outlined group-hover:text-primary transition-colors">school</span>
                        <span className="hidden lg:block font-medium text-sm">Aprender</span>
                    </Link>
                    <Link to="#" className="flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                        <span className="material-symbols-outlined group-hover:text-primary transition-colors">extension</span>
                        <span className="hidden lg:block font-medium text-sm">Puzzles</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10 space-y-4">
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group">
                        <span className="material-symbols-outlined">settings</span>
                        <span className="hidden lg:block font-medium text-sm">Configurações</span>
                    </Link>

                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary/20 ring-ambient cursor-pointer transition-transform hover:scale-105" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8cU5gMr__zp2ZQt05r2_8_RPYu2Nu5gVF3W9dPJt4_wkpZg0thFFy7YXfJhQTyXVmNqGun3a_z7mtJqptWBnek_B8VPAnNsu9JdhtIMPmccX2t0ZleZJlSIQIQ8vVwCgT_sYv97_ZJVHRu-XOTf7LMT3tqzRrvUzKoMRud_3ZcL_rbIsgXLbkVFDXFzqPq_aARSna0ZvkPJDTlzEaPIn2FGNaFsx2xwveka2sUpeXDh_hTO3_oBrJgbH_yTO1aUyndF4Yr-CjnyT8")' }}></div>
                        <div className="hidden lg:block">
                            <div className="text-sm font-bold text-white">Você</div>
                            <div className="text-xs text-gray-500">Premium Member</div>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Floating Feedback */}
                <FloatingFeedback
                    message={currentFeedback}
                    isVisible={showFloatingFeedback}
                    onDismiss={() => setShowFloatingFeedback(false)}
                />

                {/* Main Content (Board) - Glass Morphism */}
                <div className="flex-1 flex items-center justify-center p-8 relative">
                    {/* AI Orb - Floating */}
                    <div className="absolute top-8 right-8 z-50">
                        <AIOrb emotion="analytical" isActive={aiOrbActive} />
                    </div>

                    {/* Constrained Container for Perfect Alignment */}
                    <div className="flex flex-col gap-3 w-full max-w-md lg:max-w-none lg:w-auto lg:h-[85vh] lg:aspect-[9/11]">

                        {/* Player Top (Opponent) - Glass Card */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`glass-strong w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300 ${activeColor === 'b'
                                ? 'border-purple-500/20 shadow-ambient-active'
                                : 'border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center relative transition-all ${activeColor === 'b' ? 'ring-ambient-active shadow-ambient' : 'ring-1 ring-white/10'
                                    }`}>
                                    <span className="material-symbols-outlined text-2xl text-gray-400">smart_toy</span>
                                    {activeColor === 'b' && (
                                        <div className="absolute -top-1 -right-1 size-3 bg-green-500 rounded-full animate-pulse" />
                                    )}
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${activeColor === 'b' ? 'text-purple-300' : 'text-gray-300'}`}>
                                        Aristóteles (Nível 1)
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">Rating: 3200</div>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl font-mono text-xl font-bold tracking-tight transition-all ${activeColor === 'b' ? 'bg-purple-500/10 text-white shadow-ambient' : 'bg-white/5 text-gray-400'
                                }`}>
                                {Math.floor(blackTime / 60)}:{(blackTime % 60).toString().padStart(2, '0')}
                            </div>
                        </motion.div>

                        {/* Board Container - Glass Morphism */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                            className="relative w-full aspect-square glass-strong rounded-2xl overflow-hidden border border-white/10 shadow-ambient">
                            {/* Arrows Layer */}
                            {renderArrows()}

                            {/* Board Grid */}
                            <div className="w-full h-full grid grid-cols-8 grid-rows-8 font-serif">
                                {renderBoard()}
                            </div>
                        </motion.div>

                        {/* Player Bottom (User) - Glass Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className={`glass-strong w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-300 ${activeColor === 'w'
                                ? 'border-purple-500/20 shadow-ambient-active'
                                : 'border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`size-12 rounded-xl flex items-center justify-center relative transition-all ${activeColor === 'w' ? 'ring-ambient-active shadow-ambient' : 'ring-1 ring-white/10'
                                    }`}>
                                    <span className="material-symbols-outlined text-2xl text-gray-400">person</span>
                                    {activeColor === 'w' && (
                                        <div className="absolute -top-1 -right-1 size-3 bg-green-500 rounded-full animate-pulse" />
                                    )}
                                </div>
                                <div>
                                    <div className={`text-sm font-bold ${activeColor === 'w' ? 'text-purple-300' : 'text-gray-300'}`}>
                                        Você
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">Rating: 1200</div>
                                </div>
                            </div>
                            <div className={`px-4 py-2 rounded-xl font-mono text-xl font-bold tracking-tight transition-all ${activeColor === 'w' ? 'bg-purple-500/10 text-white shadow-ambient' : 'bg-white/5 text-gray-400'
                                }`}>
                                {Math.floor(whiteTime / 60)}:{(whiteTime % 60).toString().padStart(2, '0')}
                            </div>
                        </motion.div>
                    </div>
                </div>

            </main>
        </div>
    )
}
