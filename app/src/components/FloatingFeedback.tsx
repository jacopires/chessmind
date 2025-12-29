import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface FloatingFeedbackProps {
    message: string
    isVisible: boolean
    moveQuality?: 'Best' | 'Good' | 'Mistake' | 'Blunder'
    onDismiss?: () => void
}

export function FloatingFeedback({ message, isVisible, moveQuality, onDismiss }: FloatingFeedbackProps) {
    const [displayedText, setDisplayedText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)

    // Quality-based color gradients
    const qualityColors = {
        Best: 'from-green-500/10 to-emerald-500/5',
        Good: 'from-blue-500/10 to-cyan-500/5',
        Mistake: 'from-amber-500/10 to-yellow-500/5',
        Blunder: 'from-red-500/10 to-rose-500/5'
    }

    const currentGradient = moveQuality ? qualityColors[moveQuality] : 'from-purple-500/5 to-transparent'

    // Typewriter effect
    useEffect(() => {
        if (isVisible && currentIndex < message.length) {
            const timeout = setTimeout(() => {
                setDisplayedText(prev => prev + message[currentIndex])
                setCurrentIndex(prev => prev + 1)
            }, 30)
            return () => clearTimeout(timeout)
        }
    }, [currentIndex, message, isVisible])

    // Reset on message change
    useEffect(() => {
        setDisplayedText('')
        setCurrentIndex(0)
    }, [message])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute top-4 right-4 max-w-md z-50"
                >
                    <div className="relative backdrop-blur-xl bg-white/[0.02] border border-white/10 rounded-2xl p-6 shadow-ambient-active">
                        {/* Subtle ambient pulse - quality-based color */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${currentGradient}`} />

                        {/* Content */}
                        <div className="relative">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse mt-2" />
                                <p className="text-sm font-medium text-purple-300">Aristóteles</p>
                            </div>

                            <p className="text-white/90 text-sm leading-relaxed font-light">
                                {displayedText}
                                {currentIndex < message.length && (
                                    <span className="inline-block w-1 h-4 bg-purple-400 ml-1 animate-pulse" />
                                )}
                            </p>
                        </div>

                        {/* Dismiss button */}
                        {currentIndex >= message.length && onDismiss && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={onDismiss}
                                className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
