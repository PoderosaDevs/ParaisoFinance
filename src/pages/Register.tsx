import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_URL } from '../services/api';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Integração com a API local
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar conta.');
      }

      // Conta criada com sucesso, envia para o login
      navigate('/login');
    } catch (err) {
      setError('Houve um problema ao criar sua conta. Tente outro e-mail.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Comece agora</h2>
        <p className="text-gray-500 mt-2 text-sm">Crie sua conta em menos de 2 minutos.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
          {error}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Nome Completo
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-gray-400 text-sm"
            placeholder="Seu nome"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            E-mail de Trabalho
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-gray-400 text-sm"
            placeholder="nome@empresa.com"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Senha
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-gray-400 text-sm"
            placeholder="No mínimo 8 caracteres"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Confirmar Senha
          </label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-gray-400 text-sm"
            placeholder="Repita sua senha"
          />
        </div>

        <div className="flex items-start gap-2.5 py-1">
          <input type="checkbox" required id="terms" className="mt-1 accent-brand-green" />
          <label htmlFor="terms" className="text-xs text-gray-500 leading-normal">
            Eu aceito os <span className="text-brand-green font-bold cursor-pointer hover:underline">Termos de Serviço</span> e a <span className="text-brand-green font-bold cursor-pointer hover:underline">Política de Privacidade</span>.
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-brand-green hover:bg-brand-green-hover disabled:bg-brand-green/60 text-white font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-brand-green/15 cursor-pointer text-sm mt-2 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Criando conta...
            </>
          ) : (
            'Criar minha conta'
          )}
        </button>
      </form>

      <p className="text-center mt-6 text-sm text-gray-500">
        Já possui uma conta?{' '}
        <Link to="/login" className="text-brand-green font-bold cursor-pointer hover:underline">
          Fazer Login
        </Link>
      </p>
    </>
  );
}