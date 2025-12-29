import { motion } from 'framer-motion'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

export default function Dashboard() {
    // Mock data - Replace with real Supabase data later
    const ratingHistory = [
        { date: 'Jan', rating: 1200 },
        { date: 'Fev', rating: 1180 },
        { date: 'Mar', rating: 1250 },
        { date: 'Abr', rating: 1220 },
        { date: 'Mai', rating: 1300 },
        { date: 'Jun', rating: 1280 },
    ]

    const recentGames = [
        { id: 1, opponent: 'Aristóteles Lvl 3', result: 'win', date: '28/12/2024', time: '3|2' },
        { id: 2, opponent: 'Aristóteles Lvl 2', result: 'loss', date: '27/12/2024', time: '5|5' },
        { id: 3, opponent: 'Aristóteles Lvl 1', result: 'win', date: '26/12/2024', time: '10' },
        { id: 4, opponent: 'Aristóteles Lvl 2', result: 'win', date: '25/12/2024', time: '3|2' },
    ]

    const stats = {
        accuracy: 87,
        totalGames: 24,
        wins: 18,
        losses: 6,
    }

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
                            <span className="text-3xl font-black text-primary">{ratingHistory[ratingHistory.length - 1].rating}</span>
                        </div>

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
                        {recentGames.map((game, index) => (
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
                                        <div className={`w-2 h-2 rounded-full ${game.result === 'win' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                                        <div className="flex flex-col">
                                            <span className="font-medium">{game.opponent}</span>
                                            <div className="flex items-center gap-2 text-xs opacity-50">
                                                <span className="font-mono">{game.date}</span>
                                                <span>•</span>
                                                <span>{game.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm font-mono ${game.result === 'win' ? 'text-green-400' : 'text-red-400'}`}>
                                            {game.result === 'win' ? '1-0' : '0-1'}
                                        </span>
                                        <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">
                                            arrow_forward
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
