import { motion } from 'framer-motion'

interface AdvantageBarProps {
    evaluation: number // Stockfish eval in centipawns
}

export function AdvantageBar({ evaluation }: AdvantageBarProps) {
    // Convert eval to percentage (-2000 to +2000 → 0% to 100%)
    // Clamp extreme values
    const clampedEval = Math.max(-2000, Math.min(2000, evaluation))
    const percentage = 50 + (clampedEval / 40) // -2000→0%, 0→50%, +2000→100%

    return (
        <div className="relative h-full w-1 bg-white/5 rounded-full overflow-hidden">
            {/* White advantage (from bottom) */}
            <motion.div
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 via-white/60 to-transparent"
                initial={{ height: '50%' }}
                animate={{ height: `${percentage}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />

            {/* Black/Purple advantage (from top) */}
            <motion.div
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-purple-500/90 via-purple-500/60 to-transparent"
                initial={{ height: '50%' }}
                animate={{ height: `${100 - percentage}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />

            {/* Center equilibrium line */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[2px] bg-white/30 shadow-[0_0_4px_rgba(255,255,255,0.5)]" />

            {/* Neon glow effect */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    boxShadow: percentage > 55
                        ? '0 0 12px rgba(255, 255, 255, 0.4)'
                        : percentage < 45
                            ? '0 0 12px rgba(168, 85, 247, 0.4)'
                            : '0 0 8px rgba(200, 200, 200, 0.3)'
                }}
            />
        </div>
    )
}
