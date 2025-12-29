import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Settings = () => {
    const [provider, setProvider] = useState('openai');
    const [model, setModel] = useState('gpt-4o-mini');
    const [temperature, setTemperature] = useState(0.7);
    const [maxTokens, setMaxTokens] = useState(2048);
    const [apiKey, setApiKey] = useState('');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);
    const [connectionLog, setConnectionLog] = useState<string[]>(['> Inicializando configuração do Mentor IA...', '> Aguardando teste de conexão...']);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [isSaving, setIsSaving] = useState(false);

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('chessmaster_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.provider) setProvider(parsed.provider);
                if (parsed.apiKey) setApiKey(parsed.apiKey);
                if (parsed.model) setModel(parsed.model);
                if (parsed.temperature) setTemperature(parsed.temperature);
                if (parsed.maxTokens) setMaxTokens(parsed.maxTokens);

                // If we have an API key, we could optionally fetch models immediately, 
                // but let's leave it to user action or explicit test for now to avoid spamming API on load
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    }, []);

    const saveSettings = () => {
        setIsSaving(true);
        const settings = {
            provider,
            apiKey,
            model,
            temperature,
            maxTokens
        };

        try {
            localStorage.setItem('chessmaster_settings', JSON.stringify(settings));
            setConnectionLog(prev => [...prev, '> Configurações salvas localmente com sucesso.']);

            // Visual feedback delay
            setTimeout(() => {
                setIsSaving(false);
            }, 1000);
        } catch (e) {
            console.error('Failed to save settings', e);
            setConnectionLog(prev => [...prev, '> Erro ao salvar configurações.']);
            setIsSaving(false);
        }
    };

    const fetchOpenAIModels = async () => {
        if (!apiKey) {
            setConnectionLog(prev => [...prev, '> Erro: Chave da API não fornecida.']);
            setConnectionStatus('error');
            return;
        }

        setIsLoadingModels(true);
        setConnectionLog(prev => [...prev, `> Conectando a ${provider.toUpperCase()}...`]);

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }

            const data = await response.json();
            const models = data.data
                .map((m: any) => m.id)
                .filter((id: string) => id.includes('gpt'))
                .sort();

            setAvailableModels(models);
            setConnectionLog(prev => [...prev, `> Sucesso! ${models.length} modelos encontrados.`]);
            setConnectionStatus('success');

            // Set recommended model if available
            if (models.includes('gpt-4o-mini')) {
                setModel('gpt-4o-mini');
                setConnectionLog(prev => [...prev, '> Modelo recomendado "gpt-4o-mini" selecionado.']);
            } else if (models.length > 0) {
                setModel(models[0]);
            }

        } catch (error) {
            console.error('Error fetching models:', error);
            setConnectionLog(prev => [...prev, `> Falha na conexão: ${(error as Error).message}`]);
            setConnectionStatus('error');
        } finally {
            setIsLoadingModels(false);
        }
    };

    const handleTestConnection = () => {
        if (provider === 'openai') {
            fetchOpenAIModels();
        } else {
            setConnectionLog(prev => [...prev, `> Teste para provider ${provider} ainda não implementado.`]);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen font-display text-slate-900 dark:text-white flex flex-col overflow-x-hidden">
            <div className="layout-container flex h-full grow flex-col">
                {/* Top Navigation */}
                <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#282b39] px-10 py-3 bg-[#111218]">
                    <div className="flex items-center gap-4 text-white">
                        <div className="size-8 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-3xl">chess</span>
                        </div>
                        <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">ChessMaster AI</h2>
                    </div>
                    <div className="flex flex-1 justify-end gap-8">
                        <nav className="hidden md:flex items-center gap-9">
                            <Link className="text-[#9da1b9] hover:text-white text-sm font-medium leading-normal transition-colors" to="/new-game">Dashboard</Link>
                            <Link className="text-[#9da1b9] hover:text-white text-sm font-medium leading-normal transition-colors" to="/new-game">Jogos</Link>
                            <Link className="text-[#9da1b9] hover:text-white text-sm font-medium leading-normal transition-colors" to="#">Puzzles</Link>
                            <Link className="text-[#9da1b9] hover:text-white text-sm font-medium leading-normal transition-colors" to="#">Mentor IA</Link>
                            <Link className="text-white text-sm font-medium leading-normal border-b-2 border-primary pb-0.5" to="/settings">Configurações</Link>
                        </nav>
                        <div className="flex items-center gap-4">
                            <button className="flex items-center justify-center rounded-lg h-10 w-10 hover:bg-[#282b39] text-white transition-colors">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-[#282b39]" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBgpe1sFKYXhkMrBlSTkdhi-fhKBogEXoDZZQv9u5_0Y5iZKU44g-jJJcgQCy3U00BB_cElU7xFoc0grNvuqCCE2UKQ9Y_hcCmfV6690LthKMxrhUcTY_FIbuo16knsXOIQIJwCCrN24Npc26z5FEoqnEAlSoh4DLWR7OKR774-3lo0uUZL7cCkqAWNBZ99FSE1pHcpxIvT5RC3PXOpfZJGSYo13xmqgPAOyAi9oXTQ-fKVNGFcyD_WgfPLSIs_HJ6m_C2yA9Rw0pRY")' }}></div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="px-4 md:px-40 flex flex-1 justify-center py-8">
                    <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                        {/* Page Heading */}
                        <div className="flex flex-wrap justify-between gap-3 p-4 mb-2">
                            <div className="flex min-w-72 flex-col gap-3">
                                <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Integração LLM</h1>
                                <p className="text-text-secondary text-base font-normal leading-normal max-w-2xl">Conecte e personalize seu Modelo de Linguagem Preferido para potencializar o motor de análise do ChessMaster AI. Configure a temperatura e tokens para receber conselhos estratégicos otimizados.</p>
                            </div>
                        </div>

                        {/* Form Container */}
                        <div className="flex flex-col gap-6 p-4">
                            {/* Section 1: Provider Selection */}
                            <section className="flex flex-col gap-4">
                                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-1 border-b border-surface-border">1. Selecionar Provedor de IA</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                    {/* OpenAI Card */}
                                    <label className={`relative flex flex-col items-center gap-4 rounded-xl border border-solid bg-surface-dark p-6 cursor-pointer hover:border-primary/50 transition-all ${provider === 'openai' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-surface-border'}`}>
                                        <div className="absolute top-4 right-4">
                                            <input
                                                type="radio"
                                                name="provider"
                                                checked={provider === 'openai'}
                                                onChange={() => setProvider('openai')}
                                                className="h-5 w-5 border-2 border-surface-border bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                                            />
                                        </div>
                                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center text-white mb-2">
                                            <span className="material-symbols-outlined text-3xl">smart_toy</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white text-lg font-bold leading-normal">OpenAI</p>
                                            <p className="text-text-secondary text-sm font-normal">GPT-4o, GPT-3.5 Turbo</p>
                                        </div>
                                    </label>

                                    {/* Google Gemini Card */}
                                    <label className={`relative flex flex-col items-center gap-4 rounded-xl border border-solid bg-surface-dark p-6 cursor-pointer hover:border-primary/50 transition-all ${provider === 'gemini' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-surface-border'}`}>
                                        <div className="absolute top-4 right-4">
                                            <input
                                                type="radio"
                                                name="provider"
                                                checked={provider === 'gemini'}
                                                onChange={() => setProvider('gemini')}
                                                className="h-5 w-5 border-2 border-surface-border bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                                            />
                                        </div>
                                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center text-white mb-2">
                                            <span className="material-symbols-outlined text-3xl">colors_spark</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white text-lg font-bold leading-normal">Google Gemini</p>
                                            <p className="text-text-secondary text-sm font-normal">Gemini 1.5 Pro, Flash</p>
                                        </div>
                                    </label>

                                    {/* Anthropic Card */}
                                    <label className={`relative flex flex-col items-center gap-4 rounded-xl border border-solid bg-surface-dark p-6 cursor-pointer hover:border-primary/50 transition-all ${provider === 'anthropic' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-surface-border'}`}>
                                        <div className="absolute top-4 right-4">
                                            <input
                                                type="radio"
                                                name="provider"
                                                checked={provider === 'anthropic'}
                                                onChange={() => setProvider('anthropic')}
                                                className="h-5 w-5 border-2 border-surface-border bg-transparent text-primary focus:ring-primary focus:ring-offset-0"
                                            />
                                        </div>
                                        <div className="size-12 rounded-full bg-white/10 flex items-center justify-center text-white mb-2">
                                            <span className="material-symbols-outlined text-3xl">psychology</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-white text-lg font-bold leading-normal">Anthropic</p>
                                            <p className="text-text-secondary text-sm font-normal">Claude 3.5 Sonnet, Opus</p>
                                        </div>
                                    </label>
                                </div>
                            </section>

                            {/* Section 2: Configuration */}
                            <section className="flex flex-col gap-6 mt-4">
                                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-1 border-b border-surface-border">2. Autenticação e Modelo</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* API Key Input */}
                                    <label className="flex flex-col flex-1">
                                        <div className="flex justify-between items-center pb-2">
                                            <p className="text-white text-sm font-medium leading-normal">Chave da API</p>
                                            <a className="text-primary text-xs hover:underline" href="#">Obtenha sua chave</a>
                                        </div>
                                        <div className="flex w-full flex-1 items-stretch rounded-lg group focus-within:ring-2 ring-primary/50 transition-all">
                                            <input
                                                type="password"
                                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-lg text-white border border-surface-border bg-surface-dark h-12 placeholder:text-text-secondary p-[15px] border-r-0 focus:border-primary focus:ring-0 text-sm font-mono"
                                                placeholder="sk-..."
                                                value={apiKey}
                                                onChange={(e) => setApiKey(e.target.value)}
                                            />
                                            <button className="text-text-secondary hover:text-white flex border border-surface-border bg-surface-dark items-center justify-center px-4 rounded-r-lg border-l-0 transition-colors">
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </div>
                                        <p className="text-text-secondary text-xs mt-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">lock</span>
                                            Sua chave é criptografada e armazenada localmente.
                                        </p>
                                    </label>

                                    {/* Model Selector */}
                                    <label className="flex flex-col flex-1">
                                        <p className="text-white text-sm font-medium leading-normal pb-2">Selecionar Modelo</p>
                                        <div className="relative">
                                            <select
                                                className="w-full h-12 rounded-lg bg-surface-dark border border-surface-border text-white px-4 text-sm focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer disabled:opacity-50"
                                                value={model}
                                                onChange={(e) => setModel(e.target.value)}
                                                disabled={isLoadingModels || (provider === 'openai' && availableModels.length === 0 && !apiKey)}
                                            >
                                                {provider === 'openai' && availableModels.length > 0 ? (
                                                    availableModels.map(m => (
                                                        <option key={m} value={m}>
                                                            {m === 'gpt-4o-mini' ? 'o4-mini (Recomendado)' : m}
                                                        </option>
                                                    ))
                                                ) : (
                                                    <>
                                                        <option value="gpt-4o-mini">o4-mini (Recomendado)</option>
                                                        <option value="gpt-4o">GPT-4o</option>
                                                        <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                                                        <option value="gemini-1-5-pro">Gemini 1.5 Pro</option>
                                                    </>
                                                )}
                                            </select>
                                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
                                                {isLoadingModels ? (
                                                    <span className="material-symbols-outlined animate-spin">refresh</span>
                                                ) : (
                                                    <span className="material-symbols-outlined">expand_more</span>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-text-secondary text-xs mt-2">Modelos mais inteligentes fornecem melhores análises posicionais.</p>
                                    </label>
                                </div>
                            </section>

                            {/* Section 3: Fine Tuning */}
                            <section className="flex flex-col gap-6 mt-4">
                                <h2 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] pb-1 border-b border-surface-border">3. Parâmetros</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface-dark rounded-xl p-6 border border-surface-border">
                                    {/* Temperature Slider */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium text-sm">Temperatura</span>
                                                <div className="group relative flex justify-center">
                                                    <span className="material-symbols-outlined text-text-secondary text-[16px] cursor-help">info</span>
                                                    <span className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-black text-xs text-white rounded opacity-90">Controla a aleatoriedade. Valores menores significam mais determinismo (melhor para xadrez).</span>
                                                </div>
                                            </div>
                                            <span className="text-primary font-mono font-bold text-sm bg-primary/10 px-2 py-1 rounded">{temperature}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="0.1"
                                            value={temperature}
                                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                            className="w-full h-1 bg-surface-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#1337ec] [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-surface-border [&::-webkit-slider-runnable-track]:rounded-lg"
                                        />
                                        <div className="flex justify-between text-xs text-text-secondary">
                                            <span>Preciso</span>
                                            <span>Criativo</span>
                                        </div>
                                    </div>

                                    {/* Max Tokens Slider */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium text-sm">Máximo de Tokens</span>
                                                <div className="group relative flex justify-center">
                                                    <span className="material-symbols-outlined text-text-secondary text-[16px] cursor-help">info</span>
                                                    <span className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-black text-xs text-white rounded opacity-90">Tamanho máximo da explicação da IA por lance.</span>
                                                </div>
                                            </div>
                                            <span className="text-primary font-mono font-bold text-sm bg-primary/10 px-2 py-1 rounded">{maxTokens}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="256"
                                            max="4096"
                                            step="256"
                                            value={maxTokens}
                                            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                                            className="w-full h-1 bg-surface-border rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#1337ec] [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:bg-surface-border [&::-webkit-slider-runnable-track]:rounded-lg"
                                        />
                                        <div className="flex justify-between text-xs text-text-secondary">
                                            <span>Curto</span>
                                            <span>Detalhado</span>
                                        </div>
                                    </div>
                                </div>

                                {/* System Prompt */}
                                <div className="flex flex-col gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer w-fit">
                                        <span className="material-symbols-outlined text-text-secondary">tune</span>
                                        <span className="text-white text-sm font-medium">Avançado: Prompt do Sistema</span>
                                    </label>
                                    <textarea
                                        className="w-full rounded-lg bg-surface-dark border border-surface-border text-text-secondary text-sm p-4 h-24 focus:border-primary focus:ring-1 focus:ring-primary resize-none font-mono"
                                        placeholder="Você é um treinador Grande Mestre de xadrez. Analise posições focando na estrutura de peões e segurança do rei..."
                                    ></textarea>
                                </div>
                            </section>

                            {/* Test Console Area */}
                            <div className="bg-black rounded-lg border border-surface-border p-4 mt-2 font-mono text-xs">
                                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                                    <span className="text-text-secondary">Log de Conexão</span>
                                    <span className={`flex items-center gap-1 ${connectionStatus === 'success' ? 'text-green-500' : connectionStatus === 'error' ? 'text-red-500' : 'text-text-secondary'}`}>
                                        <span className={`block w-2 h-2 rounded-full ${connectionStatus === 'success' ? 'bg-green-500 animate-pulse' : connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                                        {connectionStatus === 'success' ? 'Conectado' : connectionStatus === 'error' ? 'Erro' : 'Aguardando'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 text-gray-400 max-h-32 overflow-y-auto">
                                    {connectionLog.map((log, index) => (
                                        <p key={index} className={log.startsWith('> Erro') || log.startsWith('> Falha') ? 'text-red-400' : log.startsWith('> Sucesso') ? 'text-green-400' : ''}>{log}</p>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-end items-center pt-4 border-t border-surface-border mt-2">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={isLoadingModels}
                                    className="w-full sm:w-auto px-6 h-12 rounded-lg border border-surface-border text-white font-medium hover:bg-surface-border/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingModels ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">wifi_tethering</span>}
                                    {isLoadingModels ? 'Conectando...' : 'Testar Conexão'}
                                </button>
                                <button
                                    onClick={saveSettings}
                                    disabled={isSaving}
                                    className={`w-full sm:w-auto px-8 h-12 rounded-lg font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-green-600 text-white' : 'bg-primary hover:bg-blue-700 text-white shadow-primary/25'}`}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="material-symbols-outlined">check</span>
                                            Salvo!
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">save</span>
                                            Salvar Configuração
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
