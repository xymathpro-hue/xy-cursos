'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simular cadastro (substituir por Supabase)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/dashboard');
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">
        Criar conta grátis
      </h1>
      <p className="text-dark-400 mb-8">
        Comece sua jornada de estudos agora mesmo.
      </p>

      <form onSubmit={handleCadastro} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Nome completo
          </label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input"
            required
            minLength={6}
          />
          <p className="text-dark-500 text-xs mt-1">Mínimo 6 caracteres</p>
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 w-4 h-4 rounded border-dark-600 bg-dark-800 text-accent-purple focus:ring-accent-purple"
            required
          />
          <label htmlFor="terms" className="text-sm text-dark-400">
            Concordo com os{' '}
            <Link href="/termos" className="text-accent-purple hover:text-accent-purple/80">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="text-accent-purple hover:text-accent-purple/80">
              Política de Privacidade
            </Link>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4"
        >
          {loading ? 'Criando conta...' : 'Criar conta grátis'}
        </button>
      </form>

      <p className="mt-8 text-center text-dark-400">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-accent-purple hover:text-accent-purple/80 font-medium">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
