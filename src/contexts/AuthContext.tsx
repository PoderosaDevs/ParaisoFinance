import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    triggerSessionExpired: () => void; // 👈 Novo gatilho exposto para a API/App usar
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Estados para o controle do alerta visual de expiração
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const savedToken = localStorage.getItem('@GreenFinance:token');
        const savedUser = localStorage.getItem('@GreenFinance:user');

        if (savedToken && savedUser && savedUser !== 'undefined') {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('@GreenFinance:token');
                localStorage.removeItem('@GreenFinance:user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const data = await apiService.login(email, password);
            console.log("Resposta da API:", data);

            const userToSave = data.user || data.usuario;
            const tokenToSave = data.token;

            if (!tokenToSave) {
                throw new Error('Token não retornado pela API');
            }

            setUser(userToSave || null);
            setToken(tokenToSave);

            localStorage.setItem('@GreenFinance:token', tokenToSave);

            if (userToSave) {
                localStorage.setItem('@GreenFinance:user', JSON.stringify(userToSave));
            } else {
                localStorage.setItem('@GreenFinance:user', JSON.stringify({ id: '1', name: 'Usuário', email }));
            }

        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('@GreenFinance:token');
        localStorage.removeItem('@GreenFinance:user');
    };

    // ─── GATILHO AUTOMÁTICO DE SESSÃO EXPIRADA ───
    const triggerSessionExpired = () => {
        if (isExpired) return; // Evita múltiplos gatilhos simultâneos
        setIsExpired(true);

        // Executa o logout definitivo após os 5 segundos (5000ms)
        setTimeout(() => {
            logout();
            setIsExpired(false);
            window.location.reload(); // Recarrega para mandar o usuário pra tela de autenticação
        }, 5000);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, triggerSessionExpired }}>
            {children}

            {/* 🚨 HTML/CSS DO ALERT GLOBAL COM PROGRESS BAR CONDICIONAL */}
            {isExpired && (
                <div className="fixed top-5 right-5 z-[9999] bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl border border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm overflow-hidden">
                    <div className="flex flex-col gap-1 pb-2">
                        <span className="font-bold text-sm text-red-400 flex items-center gap-2">
                            ⚠️ Sessão Expirada!
                        </span>
                        <p className="text-xs text-slate-300">
                            Sua credencial de acesso expirou. Você será deslogado automaticamente em 5 segundos...
                        </p>
                    </div>
                    
                    {/* A barra que representa o tempo decrementando (animada via CSS nativo) */}
                    <div className="absolute bottom-0 left-0 h-1 bg-red-500 w-full animate-[shrink_5000ms_linear_forwards]" />
                </div>
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
}