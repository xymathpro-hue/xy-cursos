'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const cursosInfo: Record<string, { nome: string; cor: string; icone: string; subtitulo: string }> = {
  enem: { nome: 'XY Matemática ENEM', cor: '#3B82F6', icone: '🎓', subtitulo: 'ESTRATÉGIA PARA O ENEM' },
  olimpico: { nome: 'XY Olímpico', cor: '#F97316', icone: '🏆', subtitulo: 'TREINAMENTO PARA OLIMPÍADAS' },
  financeiro: { nome: 'XY Educação Financeira', cor: '#22C55E', icone: '💰', subtitulo: 'DOMINE SUAS FINANÇAS' },
  ifpi: { nome: 'XY Preparatório IFPI', cor: '#A855F7', icone: '🎯', subtitulo: 'SUA VAGA NO INSTITUTO FEDERAL' },
};

export default function EntrarCursoPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const curso = cursosInfo[slug];

  const [modo, setModo] = useState<'login' | 'cadastro'>('cadastro');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const supabase = createClientComponentClient();

  if (!curso) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Curso não encontrado</h1>
          <Link href="/" className="text-accent-purple hover:underline">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    try {
      if (modo === 'cadastro') {
        // Criar conta
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            data: {
              nome_completo: nome,
            },
          },
        });

        if (authError) throw authError;

        if (authData.user) {
          // Aguardar um pouco para o trigger criar o profile
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Criar inscrição no curso
          const { error: inscricaoError } = await supabase
            .from('inscricoes')
            .insert({
              user_id: authData.user.id,
              plataforma: slug,
            });

          if (inscricaoError && !inscricaoError.message.includes('duplicate')) {
            console.error('Erro ao criar inscrição:', inscricaoError);
          }

          setSucesso('Conta criada com sucesso! Verifique seu email para confirmar.');
          
          // Redirecionar após 2 segundos
          setTimeout(() => {
            router.push(`/plataforma/${slug}`);
          }, 2000);
        }
      } else {
        // Login
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (authError) throw authError;

        if (authData.user) {
          // Verificar se já está inscrito no curso
          const { data: inscricao } = await supabase
            .from('inscricoes')
            .select('id')
            .eq('user_id', authData.user.id)
            .eq('plataforma', slug)
            .single();

          // Se não está inscrito, criar inscrição
          if (!inscricao) {
            await supabase
              .from('inscricoes')
              .insert({
                user_id: authData.user.id,
                plataforma: slug,
              });
          }

          // Redirecionar para o curso
          router.push(`/plataforma/${slug}`);
        }
      }
    } catch (error: any) {
      console.error('Erro:', error);
      if (error.message.includes('Invalid login')) {
        setErro('Email ou senha incorretos');
      } else if (error.message.includes('already registered')) {
        setErro('Este email já está cadastrado. Faça login.');
        setModo('login');
      } else {
        setErro(error.message || 'Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado esquerdo - Formulário */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-purple to-accent-blue rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">XY</span>
            </div>
            <span className="font-display font-bold text-xl text-white">XY Cursos</span>
          </Link>

          {/* Curso Info */}
          <div 
            className="p-4 rounded-xl mb-8"
            style={{ backgroundColor: `${curso.cor}15`, borderLeft: `4px solid ${curso.cor}` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{curso.icone}</span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: curso.cor }}>
                  {curso.subtitulo}
                </div>
                <div className="text-white font-bold">{curso.nome}</div>
              </div>
            </div>
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-2">
            {modo === 'cadastro' ? 'Criar conta' : 'Entrar'}
          </h1>
          <p className="text-dark-400 mb-8">
            {modo === 'cadastro' 
              ? 'Crie sua conta para acessar o curso' 
              : 'Entre para continuar seus estudos'}
          </p>

          {/* Mensagens */}
          {erro && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <p className="text-red-400 text-sm">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6">
              <p className="text-green-400 text-sm">{sucesso}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="input w-full"
                  placeholder="Seu nome"
                />
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
                required
                className="input w-full"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                className="input w-full"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: curso.cor }}
            >
              {loading 
                ? 'Aguarde...' 
                : modo === 'cadastro' 
                  ? 'Criar conta e acessar curso' 
                  : 'Entrar'}
            </button>
          </form>

          {/* Alternar modo */}
          <div className="mt-6 text-center">
            {modo === 'cadastro' ? (
              <p className="text-dark-400 text-sm">
                Já tem uma conta?{' '}
                <button 
                  onClick={() => setModo('login')} 
                  className="font-semibold hover:underline"
                  style={{ color: curso.cor }}
                >
                  Fazer login
                </button>
              </p>
            ) : (
              <p className="text-dark-400 text-sm">
                Não tem conta?{' '}
                <button 
                  onClick={() => setModo('cadastro')} 
                  className="font-semibold hover:underline"
                  style={{ color: curso.cor }}
                >
                  Criar conta
                </button>
              </p>
            )}
          </div>

          {/* Voltar */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-dark-500 text-sm hover:text-dark-300 transition-colors">
              ← Voltar para a página inicial
            </Link>
          </div>
        </div>
      </div>

      {/* Lado direito - Visual */}
      <div 
        className="hidden lg:flex flex-1 items-center justify-center p-12"
        style={{ background: `linear-gradient(135deg, ${curso.cor}20 0%, ${curso.cor}05 100%)` }}
      >
        <div className="text-center">
          <div className="text-8xl mb-6">{curso.icone}</div>
          <h2 className="text-3xl font-bold text-white mb-4">{curso.nome}</h2>
          <p className="text-dark-400 max-w-md">
            Inscreva-se gratuitamente e comece a estudar agora mesmo.
            Acompanhe seu progresso e conquiste seus objetivos!
          </p>
          
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { valor: '100%', label: 'Gratuito' },
              { valor: '24/7', label: 'Disponível' },
              { valor: '∞', label: 'Sem limite' },
            ].map((stat, index) => (
              <div 
                key={index} 
                className="p-4 rounded-xl"
                style={{ backgroundColor: `${curso.cor}15` }}
              >
                <div className="text-2xl font-bold text-white">{stat.valor}</div>
                <div className="text-dark-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
