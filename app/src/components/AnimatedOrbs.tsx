import { motion } from 'framer-motion'

export function AnimatedOrbs() {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Orb 1 - Top Left */}
            <motion.div
                className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-transparent rounded-full blur-3xl"
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            />

            {/* Orb 2 - Top Right */}
            <motion.div
                className="absolute -top-20 -right-20 w-80 h-80 bg-gradient-to-bl from-violet-500/25 via-fuchsia-500/15 to-transparent rounded-full blur-3xl"
                animate={{
                    x: [0, -80, 0],
                    y: [0, 100, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
            />

            {/* Orb 3 - Bottom Center */}
            <motion.div
                className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-t from-purple-600/20 via-indigo-500/10 to-transparent rounded-full blur-3xl"
                animate={{
                    x: [-50, 50, -50],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
            />

            {/* Orb 4 - Right Side */}
            <motion.div
                className="absolute top-1/3 -right-32 w-72 h-72 bg-gradient-to-l from-blue-500/20 via-indigo-500/15 to-transparent rounded-full blur-3xl"
                animate={{
                    y: [0, -60, 0],
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 22,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 8
                }}
            />
        </div>
    )
}
