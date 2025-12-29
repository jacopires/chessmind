import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full overflow-hidden font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-white">
            {/* Left Panel - Hero / Brand */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-surface-dark flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div
                        className="w-full h-full bg-center bg-cover opacity-50 scale-105"
                        style={{
                            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAMWfTQ8EP1FKatc5UsEQWQ5Ur_9IOo15CPJiVB-kALwS_Qp4ELdSJa8HXIHSKBIyhmWQuqGZxafSj7pHL4utQQcaVCaF5Cv5oNzPM2bq1w81xJsy9Ec11tD8suA2ht4IZWoQr6tqeWmTbbvaEomrOEAzyd7CEnkhugtHD6MCQhmxNZwnXnX6M7g8E5R8Sp1yP4vQ5vuTMDMivo6zYKuKq9TkPX1aB5vU2i1_XbVPb_OGLoUGYdKfDfpGriRlBIFP3TNg2QVGY-gRLX')",
                            filter: "grayscale(100%)"
                        }}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-dark/90 via-surface-dark/80 to-background-dark"></div>
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[100px] mix-blend-overlay"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 px-12 py-10">
                    <div className="flex items-center gap-3 text-white">
                        <div className="size-10 text-white bg-white/10 p-2 rounded-xl backdrop-blur-md shadow-lg border border-white/10">
                            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <h2 className="text-white text-2xl font-bold tracking-tight">Chess AI Mentor</h2>
                    </div>
                </div>
                <div className="relative z-10 px-12 py-12 mb-8 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-xs font-semibold text-primary-200 mb-6 uppercase tracking-wider">
                        <span className="flex h-2 w-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(168,85,247,0.8)]"></span>
                        Nova Engine IA v2.0
                    </div>
                    <h1 className="text-white tracking-tight text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-6 drop-shadow-lg">
                        Domine o Tabuleiro com <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">Inteligência Artificial</span>
                    </h1>
                    <p className="text-slate-200 text-lg font-light leading-relaxed mb-10 max-w-lg opacity-90">
                        Analise suas partidas em tempo real, identifique erros e aprenda estratégias de grandes mestres com nossa IA neural.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-white font-medium">
                        {[
                            { icon: 'analytics', label: 'Análise profunda' },
                            { icon: 'extension', label: 'Puzzles táticos' },
                            { icon: 'school', label: 'Mentor 24/7' },
                            { icon: 'auto_graph', label: 'Rating Evolution' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <div className="p-1.5 rounded-full bg-primary/30 text-white">
                                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                </div>
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Right Panel - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col bg-background-light dark:bg-background-dark overflow-y-auto relative">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 z-20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0">
                    <div className="flex items-center gap-3">
                        <div className="size-8 text-primary">
                            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fill="currentColor" fillRule="evenodd"></path>
                            </svg>
                        </div>
                        <span className="font-bold text-lg dark:text-white">Chess AI</span>
                    </div>
                    <button className="text-sm font-semibold text-primary">Ajuda</button>
                </div>
                <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-12 z-10">
                    <div className="w-full max-w-[460px] bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 border border-gray-100 dark:border-gray-800">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Bem-vindo de volta</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Entre com suas credenciais para continuar sua evolução.</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-[#020617] p-1 rounded-xl flex mb-8">
                            <button className="flex-1 py-2.5 text-center text-sm font-semibold rounded-lg bg-white dark:bg-surface-dark shadow-sm text-slate-900 dark:text-white transition-all ring-1 ring-black/5 dark:ring-white/5">
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/register')}
                                className="flex-1 py-2.5 text-center text-sm font-medium rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                            >
                                Cadastro
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-3 text-sm font-semibold text-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                                    <path d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-.4167-.0334-.8167-.1-1.2h-8.35v3.2h4.7834c-.2084 1.125-1.2584 3.2-4.7834 3.2-2.8917 0-5.25-2.3583-5.25-5.25s2.3583-5.25 5.25-5.25c1.2833 0 2.4583.4583 3.375 1.325l2.4-2.4C16.2086 4.225 14.2419 3.25 12.0003 3.25c-4.8334 0-8.75 3.9166-8.75 8.75s3.9166 8.75 8.75 8.75z" fill="currentColor"></path>
                                </svg>
                                Google
                            </button>
                            <button className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark px-4 py-3 text-sm font-semibold text-slate-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                                <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13.6004 2.87227C14.2889 2.02271 14.7336 0.856934 14.597 0C13.5684 0.043322 12.3164 0.702758 11.5833 1.57948C10.9231 2.34305 10.3323 3.55169 10.4907 4.67562C11.6496 4.76786 12.9238 4.07227 13.6004 2.87227ZM11.9602 5.09355C9.79905 5.09355 8.35881 6.34006 7.24156 6.34006C6.11183 6.34006 4.39413 5.04423 2.51624 5.07689C0.0968994 5.10955 -1.93339 7.92383 1.63751 13.1951C3.39801 15.7925 5.15049 19.3361 7.03926 19.2625C8.75336 19.1917 9.40722 18.1587 11.4996 18.1587C13.5623 18.1587 14.1209 19.2625 15.9328 19.2271C17.9158 19.1563 19.1607 17.3888 20.8929 14.808C22.2599 12.7758 22.8291 11.751 22.8645 11.6911C22.7882 11.6611 19.256 10.3664 19.2206 6.94239C19.1824 4.15559 21.464 2.82054 21.5702 2.76603C20.0057 0.448135 17.6596 0.224628 16.891 0.175567C15.0006 0.0242436 13.2925 5.09355 11.9602 5.09355Z"></path>
                                </svg>
                                Apple
                            </button>
                        </div>
                        <div className="relative flex items-center py-2 mb-6">
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                            <span className="flex-shrink-0 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wide">Ou continue com email</span>
                            <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">Email</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-slate-400 text-[20px]">alternate_email</span>
                                    </div>
                                    <input className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-background-dark py-3 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all shadow-sm" id="email" name="email" placeholder="seunome@exemplo.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Senha</label>
                                </div>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="material-symbols-outlined text-slate-400 text-[20px]">lock_open</span>
                                    </div>
                                    <input className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-background-dark py-3 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all shadow-sm" id="password" name="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                    <button className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-primary transition-colors" type="button">
                                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-surface-dark text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer" id="remember-me" name="remember-me" type="checkbox" />
                                    <label className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none" htmlFor="remember-me">Lembrar de mim</label>
                                </div>
                                <div className="text-sm">
                                    <a className="font-medium text-primary hover:text-primary-dark hover:underline transition-colors" href="#">Esqueceu a senha?</a>
                                </div>
                            </div>

                            {error && <div className="text-red-500 text-sm">{error}</div>}

                            <button className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5" type="submit">
                                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-white/50 group-hover:text-white transition-colors">login</span>
                                </span>
                                {loading ? 'Entrando...' : 'Entrar na Plataforma'}
                            </button>
                        </form>
                        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                            Não tem uma conta?
                            <button onClick={() => navigate('/register')} className="font-bold text-primary hover:text-primary-dark transition-colors ml-1">
                                Cadastre-se gratuitamente
                            </button>
                        </p>
                    </div>
                    <div className="mt-8">
                        <p className="text-xs text-center text-slate-400 dark:text-slate-500">
                            © 2024 Chess AI Mentor. Todos os direitos reservados.<br />
                            <a className="underline hover:text-slate-300 transition-colors" href="#">Privacidade</a> • <a className="underline hover:text-slate-300 transition-colors" href="#">Termos</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
