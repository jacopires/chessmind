import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Chess, type Square } from 'chess.js'
import { X, Lightbulb, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { AnimatedOrbs } from '../components/AnimatedOrbs'
import ChessPiece from '../components/ChessPiece'
import { analyzePosition, type MoveQuality } from '../lib/openai'

interface ErrorData {
    moveNumber: number
    move: string
    quality: MoveQuality
    feedback: string
    fen: string
    evaluation: number
    gameId: string
    gameDate: string
    bestMove?: string
}

export default function TheLab() {
    const { user } = useAuth()
    const [errors, setErrors] = useState<ErrorData[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedError, setSelectedError] = useState<ErrorData | null>(null)
    const [game] = useState(new Chess())
    const [showHint, setShowHint] = useState(false)
    const [showSolution, setShowSolution] = useState(false)
    const [aristotelesHint, setAristotelesHint] = useState('')
    const [success, setSuccess] = useState(false)
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)

    useEffect(() => {
        if (user) {
            fetchErrors()
        }
    }, [user])

    const fetchErrors = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('games')
            .select('id, insights, created_at, analysis_summary')
            .eq('user_id', user?.id)
            .not('insights', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50) // Last 50 games

        if (error) {
            console.error('Error fetching mistakes:', error)
            setLoading(false)
            return
        }

        // Extract all Blunders and Mistakes
        const allErrors: ErrorData[] = []
        data?.forEach(gameData => {
            gameData.insights?.forEach((insight: any) => {
                if (insight.quality === 'Blunder' || insight.quality === 'Mistake') {
                    allErrors.push({
                        ...insight,
                        gameId: gameData.id,
                        gameDate: gameData.created_at
                    })
                }
            })
        })

        setErrors(allErrors)
        setLoading(false)
    }

    const loadError = (error: ErrorData) => {
        setSelectedError(error)
        game.load(error.fen)
        setShowHint(false)
        setShowSolution(false)
        setAristotelesHint('')
        setSuccess(false)
        setSelectedSquare(null)
    }

    const handleSquareClick = (square: Square) => {
        if (!selectedError || showSolution || success) return

        if (selectedSquare === square) {
            setSelectedSquare(null)
            return
        }

        if (selectedSquare) {
            // Try to make move
            try {
                const move = game.move({ from: selectedSquare, to: square, promotion: 'q' })
                if (move) {
                    checkMove(move.san)
                }
            } catch (e) {
                // Invalid move
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

    const checkMove = (_move: string) => {
        // For now, we don't have bestMove in insights
        // We'll use AI to verify if it's a good move
        setShowHint(true)
    }

    const getArisotelesHint = async () => {
        if (!selectedError) return

        const hint = await analyzePosition({
            fen: selectedError.fen,
            UserPrompt: "Dê uma dica sutil e irônica sobre o melhor lance nesta posição, sem revelar a resposta completa. Seja breve e característico do Aristóteles."
        })

        setAristotelesHint(hint.text)
    }

    const revealSolution = async () => {
        if (!selectedError) return

        setShowSolution(true)

        // Get full solution from AI
        const solution = await analyzePosition({
            fen: selectedError.fen,
            UserPrompt: "Qual é o melhor lance nesta posição? Explique brevemente por que é superior."
        })

        setAristotelesHint(solution.text)
    }

    const renderBoard = () => {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

        return (
            <div className="grid grid-cols-8 gap-0 aspect-square w-full max-w-lg mx-auto rounded-xl overflow-hidden shadow-ambient">
                {ranks.map((rank, rankIndex) =>
                    files.map((file, fileIndex) => {
                        const square = `${file}${rank}` as Square
                        const piece = game.get(square)
                        const isLight = (rankIndex + fileIndex) % 2 === 0
                        const isSelected = selectedSquare === square

                        return (
                            <motion.div
                                key={square}
                                whileHover={{ scale: 1.05 }}
                                onClick={() => handleSquareClick(square)}
                                className={`flex items-center justify-center cursor-pointer relative ${isLight ? 'bg-slate-300' : 'bg-slate-600'
                                    } ${isSelected ? 'ring-4 ring-purple-500' : ''}`}
                            >
                                {piece && (
                                    <ChessPiece
                                        type={piece.type}
                                        color={piece.color}
                                    />
                                )}
                            </motion.div>
                        )
                    })
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen p-6 lg:p-8 relative overflow-hidden">
            <AnimatedOrbs />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-4 mb-8"
                >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center backdrop-blur-xl">
                        <span className="material-symbols-outlined text-3xl text-purple-300">science</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight">O Laboratório</h1>
                        <p className="text-gray-400">Transforme seus erros em maestria</p>
                    </div>
                </motion.div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-gray-500">Carregando erros...</p>
                    </div>
                ) : errors.length === 0 ? (
                    <div className="glass-strong rounded-2xl p-12 text-center">
                        <span className="material-symbols-outlined text-6xl text-green-400 mb-4">check_circle</span>
                        <h2 className="text-2xl font-bold mb-2">Perfeição!</h2>
                        <p className="text-gray-400">Nenhum erro grave encontrado. Continue jogando para gerar dados de treinamento.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Error Cloud - Left Sidebar */}
                        <div className="lg:col-span-4 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider mb-4">
                                Nuvem de Erros ({errors.length})
                            </h3>
                            {errors.map((error, index) => (
                                <motion.div
                                    key={`${error.gameId}-${error.moveNumber}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    onClick={() => loadError(error)}
                                    className={`glass-strong rounded-xl p-4 cursor-pointer transition-all ${selectedError?.gameId === error.gameId &&
                                        selectedError?.moveNumber === error.moveNumber
                                        ? 'ring-2 ring-purple-500 bg-purple-500/10'
                                        : 'hover:bg-white/[0.03]'
                                        }`}
                                >
                                    <div className={`inline-block text-xs px-2 py-1 rounded mb-2 ${error.quality === 'Blunder'
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                        }`}>
                                        {error.quality}
                                    </div>
                                    <p className="text-sm font-medium">Lance #{error.moveNumber}: {error.move}</p>
                                    <p className="text-xs opacity-50 mt-1">
                                        {new Date(error.gameDate).toLocaleDateString('pt-BR')}
                                    </p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Training Board - Right Side */}
                        <div className="lg:col-span-8">
                            {selectedError ? (
                                <div className="space-y-6">
                                    {/* Board */}
                                    <div className="glass-strong rounded-2xl p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold">
                                                Lance #{selectedError.moveNumber}: {selectedError.move}
                                            </h3>
                                            <button
                                                onClick={() => setSelectedError(null)}
                                                className="opacity-60 hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        {renderBoard()}

                                        {/* Action Buttons */}
                                        <div className="flex items-center gap-3 mt-6">
                                            {!showHint && !showSolution && !success && (
                                                <p className="text-sm text-gray-400">
                                                    Tente encontrar o melhor lance...
                                                </p>
                                            )}

                                            {showHint && !showSolution && !success && (
                                                <>
                                                    <button
                                                        onClick={getArisotelesHint}
                                                        disabled={aristotelesHint !== ''}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                                                    >
                                                        <Lightbulb className="w-4 h-4" />
                                                        Dica do Aristóteles
                                                    </button>
                                                    <button
                                                        onClick={revealSolution}
                                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                                                    >
                                                        Revelar Solução
                                                    </button>
                                                </>
                                            )}

                                            {success && (
                                                <div className="flex items-center gap-2 text-green-400">
                                                    <CheckCircle2 className="w-5 h-5" />
                                                    <span className="font-medium">Excelente! Você encontrou!</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Aristóteles Feedback */}
                                        {aristotelesHint && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mt-4 bg-white/[0.02] rounded-xl p-4 border-l-4 border-purple-500"
                                            >
                                                <p className="text-sm text-gray-300 italic">{aristotelesHint}</p>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Original Error Info */}
                                    <div className="glass-strong rounded-2xl p-6">
                                        <h4 className="text-sm font-bold opacity-60 uppercase tracking-wider mb-3">
                                            Feedback Original
                                        </h4>
                                        <p className="text-gray-300 italic">{selectedError.feedback}</p>
                                        <p className="text-xs opacity-50 mt-2">
                                            Avaliação: {selectedError.evaluation > 0 ? '+' : ''}{selectedError.evaluation}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-strong rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center">
                                    <span className="material-symbols-outlined text-6xl text-purple-400 mb-4 opacity-50">
                                        science
                                    </span>
                                    <h3 className="text-xl font-bold mb-2">Selecione um erro</h3>
                                    <p className="text-gray-400">Clique em um card à esquerda para começar o treinamento</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(168, 85, 247, 0.3);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(168, 85, 247, 0.5);
                }
            `}</style>
        </div>
    )
}
