import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

export default function NewGame() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [gameMode, setGameMode] = useState('blitz')
    const [selectedTime, setSelectedTime] = useState('3|2')
    const [selectedColor, setSelectedColor] = useState('auto')
    const [isAiMentorEnabled, setIsAiMentorEnabled] = useState(false)
    const [creating, setCreating] = useState(false)

    const timeControls = {
        bullet: ['1', '1|1', '2|1'],
        blitz: ['3', '3|2', '5', '5|5'],
        rapid: ['10', '10|5', '15|10'],
        classical: ['30', '30|20', '60']
    }


    const handleStartGame = async () => {
        if (!user) {
            alert('Por favor, faça login para iniciar um jogo.')
            return
        }

        setCreating(true)
        try {
            // Resolve color if auto
            const finalColor = selectedColor === 'auto'
                ? (Math.random() > 0.5 ? 'white' : 'black')
                : selectedColor

            const { data, error } = await supabase
                .from('games')
                .insert({
                    user_id: user.id,
                    player_color: finalColor,
                    pgn: '', // Empty PGN for new game
                    result: '*', // Active game result
                    metadata: {
                        mode: gameMode,
                        time: selectedTime,
                        ai_mentor: isAiMentorEnabled,
                        type: isAiMentorEnabled ? 'unranked' : 'ranked'
                    }
                })
                .select()
                .single()

            if (error) throw error

            if (data) {
                // Navigate to game with ID and visual cues
                navigate(`/game/${data.id}`, {
                    state: {
                        gameId: data.id,
                        timeControl: selectedTime,
                        color: finalColor, // Pass resolved color
                        aiMentor: isAiMentorEnabled
                    }
                })
            }
        } catch (error: any) {
            console.error('Error creating game:', error)
            alert('Erro ao criar o jogo. Tente novamente.')
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="flex-1 flex justify-center py-8 px-4 md:px-8">
            <div className="w-full max-w-[960px] flex flex-col gap-6">
                {/* PageHeading */}
                <div className="flex flex-col gap-2 pb-6">
                    <h1 className="text-white text-4xl font-black leading-tight tracking-[-0.033em]">Novo Jogo</h1>
                    <p className="text-[#9da1b9] text-base font-normal">Configure sua partida, escolha o tempo e desafie suas habilidades.</p>
                </div>

                {/* Game Setup Container */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Settings */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* 1. Game Style Tabs */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white tracking-tight text-xl font-bold flex items-center gap-2">
                                <span className="flex items-center justify-center bg-primary/20 text-primary w-6 h-6 rounded-full text-xs">1</span>
                                Ritmo de Jogo
                            </h3>
                            <div className="bg-white/[0.02] rounded-xl p-1 flex flex-wrap sm:flex-nowrap gap-1">
                                <button
                                    onClick={() => { setGameMode('bullet'); setSelectedTime('1') }}
                                    className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg gap-1 transition-all ${gameMode === 'bullet' ? 'bg-primary text-white shadow-lg shadow-primary/25 transform scale-[1.02]' : 'text-[#9da1b9] hover:bg-border-dark/50 hover:text-white group'}`}
                                >
                                    <span className={`material-symbols-outlined ${gameMode === 'bullet' ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`}>bolt</span>
                                    <span className="text-sm font-bold">Bullet</span>
                                </button>
                                <button
                                    onClick={() => { setGameMode('blitz'); setSelectedTime('3|2') }}
                                    className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg gap-1 transition-all ${gameMode === 'blitz' ? 'bg-primary text-white shadow-lg shadow-primary/25 transform scale-[1.02]' : 'text-[#9da1b9] hover:bg-border-dark/50 hover:text-white group'}`}
                                >
                                    <span className={`material-symbols-outlined ${gameMode === 'blitz' ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`}>local_fire_department</span>
                                    <span className="text-sm font-bold">Blitz</span>
                                </button>
                                <button
                                    onClick={() => { setGameMode('rapid'); setSelectedTime('10') }}
                                    className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg gap-1 transition-all ${gameMode === 'rapid' ? 'bg-primary text-white shadow-lg shadow-primary/25 transform scale-[1.02]' : 'text-[#9da1b9] hover:bg-border-dark/50 hover:text-white group'}`}
                                >
                                    <span className={`material-symbols-outlined ${gameMode === 'rapid' ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`}>timer</span>
                                    <span className="text-sm font-bold">Rápido</span>
                                </button>
                                <button
                                    onClick={() => { setGameMode('classical'); setSelectedTime('30') }}
                                    className={`flex-1 flex flex-col items-center justify-center py-3 px-2 rounded-lg gap-1 transition-all ${gameMode === 'classical' ? 'bg-primary text-white shadow-lg shadow-primary/25 transform scale-[1.02]' : 'text-[#9da1b9] hover:bg-border-dark/50 hover:text-white group'}`}
                                >
                                    <span className={`material-symbols-outlined ${gameMode === 'classical' ? 'fill-current' : 'group-hover:scale-110 transition-transform'}`}>menu_book</span>
                                    <span className="text-sm font-bold">Clássico</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Time Control Grid */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-white tracking-tight text-xl font-bold flex items-center gap-2">
                                <span className="flex items-center justify-center bg-primary/20 text-primary w-6 h-6 rounded-full text-xs">2</span>
                                Tempo
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                                {/* Dynamic Time Controls based on Mode - Levitating */}
                                {timeControls[gameMode as keyof typeof timeControls].map((t) => (
                                    <motion.button
                                        key={t}
                                        onClick={() => setSelectedTime(t)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        animate={selectedTime === t ? {
                                            scale: 1.05,
                                            boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.4)'
                                        } : {}}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className={`relative flex flex-col items-center justify-center h-24 rounded-xl transition-all ${selectedTime === t
                                            ? 'bg-primary/15 text-white'
                                            : 'bg-white/[0.02] text-[#9da1b9] hover:bg-white/[0.04] hover:text-white'
                                            }`}
                                    >
                                        {selectedTime === t && (
                                            <div className="absolute top-2 right-2 text-primary">
                                                <span className="material-symbols-outlined text-base">check_circle</span>
                                            </div>
                                        )}
                                        <span className="text-2xl font-bold">{t.replace('|', ' | ')}</span>
                                        <span className={`text-xs font-medium ${selectedTime === t ? 'text-primary' : 'opacity-60'}`}>
                                            {t.includes('|') ? 'min | inc' : 'min'}
                                        </span>
                                    </motion.button>
                                ))}

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative flex flex-col items-center justify-center h-24 rounded-xl bg-white/[0.02] text-[#9da1b9] hover:bg-white/[0.04] hover:text-white transition-all group"
                                >
                                    <span className="material-symbols-outlined text-3xl mb-1 group-hover:scale-110 transition-transform">tune</span>
                                    <span className="text-xs font-medium">Personalizar</span>
                                </motion.button>
                            </div>
                        </div>

                        {/* 3. AI Mentor Toggle */}
                        <div className="mt-2">
                            <label className="relative flex items-center justify-between p-5 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-card-dark to-purple-900/10 cursor-pointer hover:border-purple-500/50 transition-colors group">
                                <div className="flex gap-4 items-center">
                                    <div className="size-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <span className="material-symbols-outlined text-2xl">psychology</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors">Mentor IA</span>
                                        <span className="text-[#9da1b9] text-sm">Análise de lances em tempo real e sugestões.</span>
                                        <span className="text-xs text-purple-400 mt-1 font-medium bg-purple-400/10 px-2 py-0.5 rounded w-fit">Partida não ranqueada</span>
                                    </div>
                                </div>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isAiMentorEnabled}
                                        onChange={(e) => setIsAiMentorEnabled(e.target.checked)}
                                    />
                                    <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Right Column: Finalize */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Color Selection */}
                        <div className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-4">
                            <h3 className="text-white font-bold text-lg">Escolha sua cor</h3>
                            <div className="flex gap-3 justify-between">
                                <button
                                    onClick={() => setSelectedColor('white')}
                                    className={`flex-1 h-14 rounded-lg flex items-center justify-center transition-all group ${selectedColor === 'white' ? 'bg-primary/20 border-2 border-primary' : 'bg-[#282b39] hover:bg-[#34384b] border border-transparent hover:border-white/20'}`}
                                >
                                    <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">check_box_outline_blank</span>
                                </button>
                                <button
                                    onClick={() => setSelectedColor('auto')}
                                    className={`flex-1 h-14 rounded-lg flex items-center justify-center transition-all relative ${selectedColor === 'auto' ? 'bg-primary/20 border-2 border-primary' : 'bg-[#282b39] hover:bg-[#34384b] border border-transparent hover:border-white/20'}`}
                                >
                                    {selectedColor === 'auto' && (
                                        <div className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">AUTO</div>
                                    )}
                                    <span className="material-symbols-outlined text-primary text-3xl">shuffle</span>
                                </button>
                                <button
                                    onClick={() => setSelectedColor('black')}
                                    className={`flex-1 h-14 rounded-lg flex items-center justify-center transition-all group ${selectedColor === 'black' ? 'bg-primary/20 border-2 border-primary' : 'bg-[#282b39] hover:bg-[#34384b] border border-transparent hover:border-white/20'}`}
                                >
                                    <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform fill-current">check_box</span>
                                </button>
                            </div>
                            <p className="text-xs text-center text-[#9da1b9] mt-1">Jogar com as brancas, aleatório ou pretas.</p>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-card-dark rounded-2xl border border-border-dark p-6 flex flex-col gap-4 flex-1">
                            <h3 className="text-white font-bold text-lg border-b border-border-dark pb-3">Resumo</h3>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#9da1b9]">Variante</span>
                                <span className="text-white font-semibold capitalize">Standard</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#9da1b9]">Tempo</span>
                                <span className="text-white font-semibold">{selectedTime.replace('|', '+')} {selectedTime.includes('|') ? '' : 'min'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#9da1b9]">Tipo</span>
                                <span className={`font-semibold flex items-center gap-1 ${isAiMentorEnabled ? 'text-purple-400' : 'text-yellow-500'}`}>
                                    <span className="material-symbols-outlined text-base">{isAiMentorEnabled ? 'school' : 'trophy'}</span>
                                    {isAiMentorEnabled ? 'Não Ranqueado' : 'Ranqueado'}
                                </span>
                            </div>

                            <div className="mt-auto pt-6">
                                <button
                                    onClick={handleStartGame}
                                    disabled={creating}
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span>{creating ? 'Criando Partida...' : 'Iniciar Jogo'}</span>
                                    {!creating && <span className="material-symbols-outlined">play_arrow</span>}
                                </button>
                                <p className="text-center text-[#9da1b9] text-xs mt-3">Ao iniciar, você concorda com as regras de Fair Play.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
