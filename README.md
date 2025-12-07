# 📚 XY Cursos

**Plataforma Integrada de Estudos** com 4 módulos especializados.

## 🎯 Plataformas

| Plataforma | Descrição | Cor |
|------------|-----------|-----|
| 🎓 **XY Matemática ENEM** | Preparação completa para o ENEM com TRI | Azul |
| 🏆 **XY Olímpico** | Treinamento para OBMEP e OBM | Laranja |
| 💰 **XY Educação Financeira** | Finanças pessoais gamificadas | Verde |
| 🎯 **XY Preparatório IFPI** | Preparação para o Instituto Federal | Roxo |

## 🛠️ Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Database)
- **Vercel** (Deploy)

## 📁 Estrutura

```
xy-cursos/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Login, Cadastro
│   │   ├── (dashboard)/      # Área logada
│   │   │   ├── dashboard/
│   │   │   ├── plataforma/[slug]/
│   │   │   ├── ranking/
│   │   │   └── perfil/
│   │   ├── layout.tsx
│   │   └── page.tsx          # Landing page
│   ├── lib/
│   │   ├── constants/        # Plataformas config
│   │   ├── supabase/
│   │   └── utils/
│   └── types/
├── supabase/
│   └── schema.sql
└── ...
```

## 🚀 Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env.local
# Editar com suas chaves do Supabase

# 3. Rodar
npm run dev
```

## 📊 Banco de Dados

Execute `supabase/schema.sql` no SQL Editor do Supabase.

### Tabelas principais:
- `profiles` - Usuários
- `modulos` - Módulos por plataforma
- `fases` - Fases de cada módulo
- `questoes` - Banco de questões
- `progresso` - Progresso do usuário
- `badges` - Conquistas

## 📈 Estatísticas

| Plataforma | Módulos | Fases | Questões* |
|------------|---------|-------|-----------|
| ENEM | 10 | 42 | 1.280+ |
| Olímpico | 6 | 31 | 800+ |
| Financeiro | 6 | 26 | 200+ |
| IFPI | 4 | 12 | 160+ |
| **Total** | **26** | **111** | **2.400+** |

*Questões a serem inseridas no banco

## 🎮 Funcionalidades

- ✅ Sistema de XP e níveis
- ✅ Streak de dias estudando
- ✅ Badges de conquistas
- ✅ Ranking global
- ✅ Progresso por plataforma
- ✅ 4 plataformas integradas

---

Desenvolvido para **XY Cursos** 🚀
