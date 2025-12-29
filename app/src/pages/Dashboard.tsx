import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { InsightModal } from '../components/InsightModal'
import { type MoveQuality } from '../lib/openai'

interface Game {
    id: string
    user_id: string
    player_color: string
    result: string
    created_at: string
    metadata?: any
    analysis_summary?: {
        best: number
        good: number
        mistake: number
        blunder: number
        totalMoves: number
        accuracy: number
    }
    insights?: GameInsight[]
}

interface GameInsight {
    moveNumber: number
    move: string
    quality: MoveQuality
    feedback: string
    fen: string
    evaluation: number
}

interface RatingPoint {
    date: string
    rating: number
}

export default function Dashboard() {
    const { user } = useAuth()
    const [userGames, setUserGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)
    const [ratingHistory, setRatingHistory] = useState<RatingPoint[]>([])
    const [stats, setStats] = useState({
        accuracy: 0,
        totalGames: 0,
        wins: 0,
        losses: 0,
        currentRating: 1200
    })
    const [selectedInsight, setSelectedInsight] = useState<GameInsight | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    useEffect(() => {
        if (user) {
            fetchUserGames()
        }
    }, [user])

    const fetchUserGames = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('games')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching games:', error)
            setLoading(false)
            return
        }

        if (data && data.length > 0) {
            setUserGames(data)
            calculateStats(data)
            calculateRatingHistory(data)
        }
        setLoading(false)
    }

    const calculateStats = (games: Game[]) => {
        const wins = games.filter(g =>
            (g.player_color === 'white' && g.result === '1-0') ||
            (g.player_color === 'black' && g.result === '0-1')
        ).length

        const losses = games.filter(g =>
            (g.player_color === 'white' && g.result === '0-1') ||
            (g.player_color === 'black' && g.result === '1-0')
        ).length

        // Calculate average accuracy from games with analysis
        const gamesWithAnalysis = games.filter(g => g.analysis_summary?.accuracy)
        const avgAccuracy = gamesWithAnalysis.length > 0
            ? Math.round(gamesWithAnalysis.reduce((sum, g) => sum + (g.analysis_summary?.accuracy || 0), 0) / gamesWithAnalysis.length)
            : 0

        // Simple ELO calculation
        let currentRating = 1200
        games.forEach(game => {
            const isWin = (game.player_color === 'white' && game.result === '1-0') ||
                (game.player_color === 'black' && game.result === '0-1')
            const isDraw = game.result === '1/2-1/2'

            if (isWin) currentRating += 20
            else if (isDraw) currentRating += 5
            else currentRating -= 15
        })

        setStats({
            accuracy: avgAccuracy,
            totalGames: games.length,
            wins,
            losses,
            currentRating
        })
    }

    const calculateRatingHistory = (games: Game[]) => {
        let currentRating = 1200
        const history: RatingPoint[] = []

        games.forEach((game, index) => {
            const isWin = (game.player_color === 'white' && game.result === '1-0') ||
                (game.player_color === 'black' && game.result === '0-1')
            const isDraw = game.result === '1/2-1/2'

            if (isWin) currentRating += 20
            else if (isDraw) currentRating += 5
            else currentRating -= 15

            // Add point every few games or last game
            if (index % 3 === 0 || index === games.length - 1) {
                history.push({
                    date: new Date(game.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    rating: currentRating
                })
            }
        })

        // Ensure we have at least some data points
        if (history.length === 0) {
            history.push({ date: 'Hoje', rating: 1200 })
        }

        setRatingHistory(history)
    }

    const handleReviewInsight = (game: Game) => {
        if (!game.insights || game.insights.length === 0) {
            console.log('No insights for this game')
            return
        }

        // Find worst move (prioritize Blunders, then lowest evaluation)
        const worstInsight = [...game.insights].sort((a, b) => {
            // Blunders first
            if (a.quality === 'Blunder' && b.quality !== 'Blunder') return -1
            if (a.quality !== 'Blunder' && b.quality === 'Blunder') return 1

            // Then Mistakes
            if (a.quality === 'Mistake' && b.quality !== 'Mistake') return -1
            if (a.quality !== 'Mistake' && b.quality === 'Mistake') return 1

            // Finally by evaluation (lowest first)
            return a.evaluation - b.evaluation
        })[0]

        setSelectedInsight(worstInsight as GameInsight)
        setIsModalOpen(true)
    }

    // Show recent games (last 5)
    const recentGames = userGames.slice(-5).reverse()

    return (
        <div className="min-h-screen p-6 lg:p-8">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-2"
                >
                    <h1 className="text-4xl font-black tracking-tight">Dashboard</h1>
                    <p className="text-gray-400">Acompanhe seu progresso e evolução tática</p>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Rating Evolution - Large Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="lg:col-span-8 glass-strong rounded-2xl p-6 shadow-ambient"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Evolução do Rating</h3>
                            <span className="text-3xl font-black text-primary">{stats.currentRating}</span>
                        </div>

                        {loading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <p className="text-gray-500">Carregando dados...</p>
                            </div>
                        ) : ratingHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={ratingHistory}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="rgba(255,255,255,0.3)"
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.3)"
                                        style={{ fontSize: '12px' }}
                                        domain={['dataMin - 50', 'dataMax + 50']}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15, 15, 20, 0.95)',
                                            border: '1px solid rgba(168, 85, 247, 0.2)',
                                            borderRadius: '12px',
                                            backdropFilter: 'blur(12px)'
                                        }}
                                        labelStyle={{ color: '#fff' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="rating"
                                        stroke="#a855f7"
                                        strokeWidth={3}
                                        dot={{ fill: '#a855f7', r: 4 }}
                                        activeDot={{ r: 6, fill: '#c084fc' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[250px] flex items-center justify-center">
                                <p className="text-gray-500">Jogue algumas partidas para ver seu progresso!</p>
                            </div>
                        )}
                    </motion.div>

                    {/* Quick Stats */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="glass-strong rounded-2xl p-6 shadow-ambient"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-purple-400">target</span>
                                </div>
                                <h4 className="text-sm font-medium opacity-60">Precisão Média</h4>
                            </div>
                            <p className="text-4xl font-black">{stats.accuracy}%</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="glass-strong rounded-2xl p-6 shadow-ambient"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-400">sports_esports</span>
                                </div>
                                <h4 className="text-sm font-medium opacity-60">Partidas</h4>
                            </div>
                            <p className="text-4xl font-black">{stats.totalGames}</p>
                            <p className="text-sm opacity-50 mt-1">{stats.wins}V - {stats.losses}D</p>
                        </motion.div>
                    </div>
                </div>

                {/* Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Favorite Pieces */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        whileHover={{ scale: 1.02 }}
                        className="glass-strong rounded-2xl p-6 shadow-ambient"
                    >
                        <h3 className="text-lg font-bold mb-4">Peças Favoritas</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { piece: '♕', name: 'Dama', percentage: 35 },
                                { piece: '♗', name: 'Bispo', percentage: 28 },
                                { piece: '♘', name: 'Cavalo', percentage: 22 }
                            ].map(({ piece, name, percentage }) => (
                                <div key={name} className="flex flex-col items-center p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.04] transition-colors">
                                    <span className="text-5xl mb-2">{piece}</span>
                                    <span className="text-xs font-medium">{name}</span>
                                    <span className="text-xs opacity-50 mt-1">{percentage}%</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Opening Repertoire */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        className="glass-strong rounded-2xl p-6 shadow-ambient"
                    >
                        <h3 className="text-lg font-bold mb-4">Aberturas Preferidas</h3>
                        <div className="space-y-3">
                            {[
                                { name: 'Italiana', games: 12, winRate: 75 },
                                { name: 'Espanhola', games: 8, winRate: 62 },
                                { name: 'Siciliana', games: 4, winRate: 50 }
                            ].map(({ name, games, winRate }) => (
                                <div key={name} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                                    <div>
                                        <p className="font-medium">{name}</p>
                                        <p className="text-xs opacity-50">{games} partidas</p>
                                    </div>
                                    <span className={`font-mono text-sm ${winRate >= 70 ? 'text-green-400' : winRate >= 50 ? 'text-blue-400' : 'text-gray-400'}`}>
                                        {winRate}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Match History */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col gap-4"
                >
                    <h3 className="text-xl font-bold">Histórico Recente</h3>

                    <div className="space-y-2">
                        {recentGames.length > 0 ? recentGames.map((game, index) => {
                            const isWin = (game.player_color === 'white' && game.result === '1-0') ||
                                (game.player_color === 'black' && game.result === '0-1')
                            const isDraw = game.result === '1/2-1/2'

                            return (
                                <motion.div
                                    key={game.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + index * 0.05 }}
                                    whileHover={{ scale: 1.01, x: 4 }}
                                    className="glass-strong rounded-xl p-4 cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                                isDraw ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]' :
                                                    'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                                                }`} />
                                            <div className="flex flex-col">
                                                <span className="font-medium">Aristóteles AI</span>
                                                <div className="flex items-center gap-2 text-xs opacity-50">
                                                    <span className="font-mono">
                                                        {new Date(game.created_at).toLocaleDateString('pt-BR')}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        {game.metadata?.timeControl || 'Rápida'}
                                                    </span>
                                                    {game.analysis_summary && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-purple-400">
                                                                {Math.round(game.analysis_summary.accuracy)}% acc
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-sm font-mono ${isWin ? 'text-green-400' :
                                                    isDraw ? 'text-yellow-400' :
                                                        'text-red-400'
                                                }`}>
                                                {game.result}
                                            </span>
                                            {game.insights && game.insights.length > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleReviewInsight(game)
                                                    }}
                                                    className="text-xs text-purple-400 opacity-60 hover:opacity-100 transition-opacity px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20"
                                                >
                                                    Rever Insight
                                                </button>
                                            )}
                                            <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">
                                                arrow_forward
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        }) : (
                            <div className="glass-strong rounded-xl p-8 text-center">
                                <p className="text-gray-500">Nenhuma partida jogada ainda</p>
                                <p className="text-sm text-gray-600 mt-2">Comece uma nova partida para ver seu histórico!</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Insight Modal */}
            <InsightModal
                isOpen={isModalOpen}
                insight={selectedInsight}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
