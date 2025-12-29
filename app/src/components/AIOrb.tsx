import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

type EmotionState = 'analytical' | 'critical' | 'encouraging' | 'positive'

interface AIOrbProps {
    emotion?: EmotionState
    isActive?: boolean
}

const emotionColors = {
    analytical: 'from-blue-500 to-cyan-500',
    critical: 'from-orange-500 to-red-500',
    encouraging: 'from-purple-500 to-pink-500',
    positive: 'from-green-500 to-emerald-500',
}

export function AIOrb({ emotion = 'analytical', isActive = false }: AIOrbProps) {
    const [particles, setParticles] = useState<number[]>([])

    useEffect(() => {
        if (isActive) {
            setParticles(Array.from({ length: 8 }, (_, i) => i))
        } else {
            setParticles([])
        }
    }, [isActive])

    return (
        <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Particles */}
            <AnimatePresence>
                {particles.map((i) => (
                    <motion.div
                        key={i}
                        className={`absolute w-2 h-2 rounded-full bg-gradient-to-br ${emotionColors[emotion]} opacity-60`}
                        initial={{ scale: 0, x: 0, y: 0 }}
                        animate={{
                            scale: [0, 1, 0],
                            x: Math.cos((i * Math.PI * 2) / 8) * 40,
                            y: Math.sin((i * Math.PI * 2) / 8) * 40,
                        }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: i * 0.1
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Core Orb */}
            <motion.div
                className={`relative w-20 h-20 rounded-full bg-gradient-to-br ${emotionColors[emotion]} shadow-[0_0_40px_-5px] shadow-current`}
                animate={{
                    scale: isActive ? [1, 1.1, 1] : 1,
                    opacity: isActive ? [0.8, 1, 0.8] : 0.6,
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                {/* Inner glow */}
                <div className="absolute inset-2 rounded-full bg-white/20 blur-md" />

                {/* Center dot */}
                <motion.div
                    className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-white"
                    animate={{
                        scale: isActive ? [1, 1.5, 1] : 1,
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>
        </div>
    )
}
