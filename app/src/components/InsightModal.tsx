import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ChessPiece from './ChessPiece'
import { type MoveQuality } from '../lib/openai'

interface GameInsight {
    moveNumber: number
    move: string
    quality: MoveQuality
    feedback: string
    fen: string
    evaluation: number
}

interface InsightModalProps {
    isOpen: boolean
    insight: GameInsight | null
    onClose: () => void
}

export function InsightModal({ isOpen, insight, onClose }: InsightModalProps) {
    if (!insight) return null

    // Render board from FEN
    const renderBoardFromFEN = (fen: string) => {
        const parts = fen.split(' ')
        const position = parts[0]
        const rows = position.split('/')

        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']

        return (
            <div className="grid grid-cols-8 gap-0 aspect-square w-full">
                {ranks.map((rank, rankIndex) => {
                    let fileIndex = 0
                    const row = rows[rankIndex]
                    const squares = []

                    for (const char of row) {
                        if (isNaN(parseInt(char))) {
                            // It's a piece
                            const file = files[fileIndex]
                            const square = `${file}${rank}`
                            const isLight = (rankIndex + fileIndex) % 2 === 0

                            squares.push(
                                <div
                                    key={square}
                                    className={`flex items-center justify-center ${isLight ? 'bg-slate-300' : 'bg-slate-600'
                                        }`}
                                >
                                    <ChessPiece
                                        type={char.toLowerCase() as any}
                                        color={char === char.toUpperCase() ? 'w' : 'b'}
                                    />
                                </div>
                            )
                            fileIndex++
                        } else {
                            // It's empty squares
                            const emptyCount = parseInt(char)
                            for (let i = 0; i < emptyCount; i++) {
                                const file = files[fileIndex]
                                const square = `${file}${rank}`
                                const isLight = (rankIndex + fileIndex) % 2 === 0

                                squares.push(
                                    <div
                                        key={square}
                                        className={`flex items-center justify-center ${isLight ? 'bg-slate-300' : 'bg-slate-600'
                                            }`}
                                    />
                                )
                                fileIndex++
                            }
                        }
                    }

                    return squares
                }).flat()}
            </div>
        )
    }

    const getQualityColor = () => {
        switch (insight.quality) {
            case 'Blunder': return 'bg-red-500/20 text-red-400'
            case 'Mistake': return 'bg-amber-500/20 text-amber-400'
            case 'Good': return 'bg-blue-500/20 text-blue-400'
            case 'Best': return 'bg-green-500/20 text-green-400'
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-6 pointer-events-none"
                    >
                        <div className="glass-strong rounded-2xl p-6 max-w-2xl w-full shadow-[0_25px_50px_-12px_rgba(168,85,247,0.4)] pointer-events-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold">
                                    Lance #{insight.moveNumber}: {insight.move}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Quality Badge */}
                            <div className={`inline-block px-3 py-1 rounded-lg text-sm font-bold mb-4 ${getQualityColor()}`}>
                                {insight.quality}
                            </div>

                            {/* Board */}
                            <div className="aspect-square max-w-md mx-auto mb-4 rounded-xl overflow-hidden shadow-ambient">
                                {renderBoardFromFEN(insight.fen)}
                            </div>

                            {/* Aristóteles Feedback */}
                            <div className="bg-white/[0.02] rounded-xl p-4 mb-3">
                                <p className="text-gray-300 italic leading-relaxed">{insight.feedback}</p>
                            </div>

                            {/* Evaluation */}
                            <p className="text-sm opacity-50 text-center">
                                Avaliação: {insight.evaluation > 0 ? '+' : ''}{insight.evaluation}
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
