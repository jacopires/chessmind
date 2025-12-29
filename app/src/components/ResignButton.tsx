import { motion, AnimatePresence } from 'framer-motion'
import { Flag } from 'lucide-react'

interface ResignButtonProps {
    onResign: () => void
    disabled?: boolean
}

export function ResignButton({ onResign, disabled = false }: ResignButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false)

    const handleConfirmResign = () => {
        setShowConfirm(false)
        onResign()
    }

    return (
        <>
            {/* Floating Resign Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300 }}
                onClick={() => setShowConfirm(true)}
                disabled={disabled}
                className="fixed bottom-8 right-8 z-40 px-6 py-3 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors shadow-lg backdrop-blur-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="flex items-center gap-2">
                    <Flag className="w-5 h-5" />
                    <span className="hidden sm:inline font-medium">Desistir</span>
                </span>
            </motion.button>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {showConfirm && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowConfirm(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-3xl z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-0 flex items-center justify-center z-50 p-6 pointer-events-none"
                        >
                            <div className="glass-strong rounded-2xl p-6 max-w-md w-full shadow-[0_25px_50px_-12px_rgba(239,68,68,0.4)] pointer-events-auto">
                                {/* Icon */}
                                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                    <Flag className="w-8 h-8 text-red-400" />
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-bold text-center mb-2">Desistir da partida?</h3>
                                <p className="text-gray-400 text-center mb-6">
                                    Esta ação não pode ser desfeita. A partida será salva como derrota.
                                </p>

                                {/* Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowConfirm(false)}
                                        className="flex-1 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleConfirmResign}
                                        className="flex-1 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors font-medium"
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

// Add missing import
import { useState } from 'react'
