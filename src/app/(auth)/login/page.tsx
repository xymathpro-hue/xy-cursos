'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Erro de login:', err);
      if (err.message.includes('Invalid login')) {
        setError('Email ou senha incorretos');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Digite seu email primeiro');
      return;
    }
    
    setResetLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      setResetSent(true);
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-white mb-2">
        Bem-vindo de volta!
      </h1>
      <p className="text-dark-400 mb-8">
        Entre na sua conta para continuar seus estudos.
      </p>

      {resetSent && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm mb-5">
          ✅ Email de recuperação enviado! Verifique sua caixa de entrada.
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-dark-300">
              Senha
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
              className="text-sm text-accent-purple hover:text-accent-purple/80 font-medium"
            >
              {resetLoading ? 'Enviando...' : 'Esqueci minha senha'}
            </button>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-8 text-center text-dark-400">
        Não tem uma conta?{' '}
        <Link href="/" className="text-accent-purple hover:text-accent-purple/80 font-medium">
          Escolha um curso e crie sua conta
        </Link>
      </p>
    </div>
  );
}
