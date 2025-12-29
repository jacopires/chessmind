import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Register() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            })

            if (error) throw error

            alert('Cadastro realizado com sucesso! Verifique seu email ou faça login.')
            navigate('/login')
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full overflow-hidden font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-white antialiased selection:bg-primary selection:text-white">
            {/* Container duplicated from Login for consistency, simplified for brevity */}
            <div className="w-full flex flex-col justify-center items-center p-6 sm:p-12 z-10">
                <div className="w-full max-w-[460px] bg-white dark:bg-surface-dark p-8 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 border border-gray-100 dark:border-gray-800">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Criar Conta</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Junte-se à comunidade Chess AI Mentor.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="fullName">Nome Completo</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">person</span>
                                </div>
                                <input className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-background-dark py-3 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all shadow-sm" id="fullName" name="fullName" placeholder="Seu Nome" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                            </div>
                        </div>

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
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Senha</label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">lock_open</span>
                                </div>
                                <input className="block w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-background-dark py-3 pl-10 pr-10 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary transition-all shadow-sm" id="password" name="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                            </div>
                        </div>

                        {error && <div className="text-red-500 text-sm">{error}</div>}

                        <button className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all transform hover:-translate-y-0.5" type="submit">
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </button>
                    </form>
                    <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Já tem uma conta?
                        <button onClick={() => navigate('/login')} className="font-bold text-primary hover:text-primary-dark transition-colors ml-1">
                            Fazer Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}
