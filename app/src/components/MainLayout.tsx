import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AnimatedOrbs } from './AnimatedOrbs'

export function MainLayout() {
    const location = useLocation()

    const userAvatar = "https://lh3.googleusercontent.com/aida-public/AB6AXuD8cU5gMr__zp2ZQt05r2_8_RPYu2Nu5gVF3W9dPJt4_wkpZg0thFFy7YXfJhQTyXVmNqGun3a_z7mtJqptWBnek_B8VPAnNsu9JdhtIMPmccX2t0ZleZJlSIQIQ8vVwCgT_sYv97_ZJVHRu-XOTf7LMT3tqzRrvUzKoMRud_3ZcL_rbIsgXLbkVFDXFzqPq_aARSna0ZvkPJDTlzEaPIn2FGNaFsx2xwveka2sUpeXDh_hTO3_oBrJgbH_yTO1aUyndF4Yr-CjnyT8"

    const isActive = (path: string) => location.pathname === path

    return (
        <div className="bg-slate-950 font-display text-white h-screen flex overflow-hidden relative">
            {/* Animated Background - The Void */}
            <AnimatedOrbs />

            {/* Floating Sidebar - Persistent */}
            <motion.aside
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-20 lg:w-64 bg-white/[0.01] backdrop-blur-3xl flex flex-col shrink-0 z-20 relative"
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6">
                    <Link to="/dashboard" className="flex items-center gap-3 group">
                        <div className="size-10 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark rounded-xl text-white shadow-ambient group-hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-xl">smart_toy</span>
                        </div>
                        <h2 className="hidden lg:block text-white text-lg font-bold leading-tight tracking-tight">ChessMind</h2>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 flex flex-col gap-2 px-3">
                    <Link
                        to="/dashboard"
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isActive('/dashboard')
                            ? 'bg-purple-500/10 text-primary-light ring-ambient shadow-ambient'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className={`material-symbols-outlined transition-all ${isActive('/dashboard')
                            ? 'opacity-100'
                            : 'opacity-40 group-hover:opacity-100 group-hover:text-primary'
                            }`}>dashboard</span>
                        <span className="hidden lg:block font-medium text-sm">Dashboard</span>
                    </Link>

                    <Link
                        to="/new-game"
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isActive('/new-game')
                            ? 'bg-purple-500/10 text-primary-light ring-ambient shadow-ambient'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className={`material-symbols-outlined transition-all ${isActive('/new-game')
                            ? 'opacity-100'
                            : 'opacity-40 group-hover:opacity-100 group-hover:text-primary'
                            }`}>sports_esports</span>
                        <span className="hidden lg:block font-bold text-sm">Jogar</span>
                    </Link>


                    <Link
                        to="/lab"
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${isActive('/lab')
                            ? 'bg-purple-500/10 text-primary-light ring-ambient shadow-ambient'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className={`material-symbols-outlined transition-all ${isActive('/lab')
                            ? 'opacity-100'
                            : 'opacity-40 group-hover:opacity-100 group-hover:text-primary'
                            }`}>science</span>
                        <span className="hidden lg:block font-medium text-sm">O Lab</span>
                    </Link>

                    <Link
                        to="#"
                        className="flex items-center gap-3 px-3 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">extension</span>
                        <span className="hidden lg:block font-medium text-sm">Puzzles</span>
                    </Link>
                </nav>

                {/* Footer: Settings & User */}
                <div className="p-4 space-y-4">
                    <Link
                        to="/settings"
                        className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                    >
                        <span className="material-symbols-outlined opacity-40 group-hover:opacity-100 transition-opacity">settings</span>
                        <span className="hidden lg:block font-medium text-sm">Configurações</span>
                    </Link>

                    <div className="flex items-center gap-3 px-2">
                        <div
                            className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-primary/20 ring-ambient cursor-pointer transition-transform hover:scale-105"
                            style={{ backgroundImage: `url("${userAvatar}")` }}
                        />
                        <div className="hidden lg:block">
                            <div className="text-sm font-bold text-white">Você</div>
                            <div className="text-xs text-gray-500">Premium Member</div>
                        </div>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-auto relative z-10">
                <Outlet />
            </main>
        </div >
    )
}
