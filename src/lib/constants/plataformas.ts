// ===========================================
// XY CURSOS - CONFIGURAÇÃO DAS 4 PLATAFORMAS
// ===========================================

export type PlataformaSlug = 'enem' | 'olimpico' | 'financeiro' | 'ifpi';

export interface Plataforma {
  slug: PlataformaSlug;
  nome: string;
  subtitulo: string;
  descricao: string;
  descricaoCompleta: string;
  icone: string;
  cor: string;
  corSecundaria: string;
  features: Feature[];
  tags: string[];
  stats: PlataformaStat[];
  modulos: Modulo[];
}

export interface Feature {
  icone: string;
  texto: string;
}

export interface PlataformaStat {
  valor: string;
  label: string;
}

export interface Modulo {
  numero: number;
  titulo: string;
  descricao: string;
  icone: string;
  fases: Fase[];
}

export interface Fase {
  numero: number;
  titulo: string;
  descricao: string;
  totalQuestoes: number;
  xpRecompensa: number;
}

// ================================================
// PLATAFORMA 1: XY MATEMÁTICA ENEM
// ================================================
const XY_MATEMATICA_ENEM: Plataforma = {
  slug: 'enem',
  nome: 'XY Matemática ENEM',
  subtitulo: 'ESTRATÉGIA PARA O ENEM',
  descricao: 'Domine a matemática do ENEM com uma plataforma completa de preparação.',
  descricaoCompleta: 'Domine a matemática do ENEM com uma plataforma completa de preparação. Sistema exclusivo de Pontos Cegos que identifica suas fraquezas, questões classificadas por TRI (400-900 pontos), e o recurso "Pensamento do Especialista" que ensina o raciocínio por trás de cada resolução.',
  icone: '🎓',
  cor: '#3B82F6',
  corSecundaria: '#60A5FA',
  features: [
    { icone: '🎯', texto: '1.280+ questões classificadas por TRI' },
    { icone: '🔍', texto: 'Sistema de Pontos Cegos exclusivo' },
    { icone: '⚡', texto: 'Alertas Preditivos de desempenho' },
    { icone: '📚', texto: '10 módulos completos com teoria' },
    { icone: '⏱️', texto: '15 simulados no formato ENEM' },
  ],
  tags: ['Linguagem de Missão', 'Meta 750+ pontos', 'Revisão espaçada'],
  stats: [
    { valor: '1.280+', label: 'Questões TRI' },
    { valor: '10', label: 'Módulos' },
    { valor: '15', label: 'Simulados' },
  ],
  modulos: [
    {
      numero: 1,
      titulo: 'Matemática Básica',
      descricao: 'Fundamentos essenciais para o ENEM',
      icone: '📐',
      fases: [
        { numero: 1, titulo: 'Operações Fundamentais', descricao: 'Soma, subtração, multiplicação e divisão', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 2, titulo: 'Frações e Decimais', descricao: 'Operações com frações e números decimais', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 3, titulo: 'Potenciação e Radiciação', descricao: 'Propriedades e operações', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 4, titulo: 'Expressões Numéricas', descricao: 'Ordem das operações', totalQuestoes: 12, xpRecompensa: 100 },
      ],
    },
    {
      numero: 2,
      titulo: 'Álgebra',
      descricao: 'Equações, funções e expressões algébricas',
      icone: '🔢',
      fases: [
        { numero: 1, titulo: 'Equações de 1º Grau', descricao: 'Resolução e interpretação', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 2, titulo: 'Equações de 2º Grau', descricao: 'Fórmula de Bhaskara e Soma/Produto', totalQuestoes: 15, xpRecompensa: 120 },
        { numero: 3, titulo: 'Sistemas Lineares', descricao: 'Métodos de resolução', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 4, titulo: 'Funções Afim e Quadrática', descricao: 'Gráficos e propriedades', totalQuestoes: 18, xpRecompensa: 150 },
        { numero: 5, titulo: 'Função Exponencial', descricao: 'Crescimento e decaimento', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 6, titulo: 'Função Logarítmica', descricao: 'Propriedades dos logaritmos', totalQuestoes: 12, xpRecompensa: 120 },
      ],
    },
    {
      numero: 3,
      titulo: 'Geometria Plana',
      descricao: 'Áreas, perímetros e propriedades',
      icone: '📏',
      fases: [
        { numero: 1, titulo: 'Triângulos', descricao: 'Classificação, áreas e propriedades', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 2, titulo: 'Quadriláteros', descricao: 'Retângulo, quadrado, losango, trapézio', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 3, titulo: 'Círculos e Circunferências', descricao: 'Área, comprimento e setores', totalQuestoes: 15, xpRecompensa: 120 },
        { numero: 4, titulo: 'Polígonos Regulares', descricao: 'Propriedades e áreas', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 5, titulo: 'Semelhança de Triângulos', descricao: 'Casos e aplicações', totalQuestoes: 12, xpRecompensa: 120 },
      ],
    },
    {
      numero: 4,
      titulo: 'Geometria Espacial',
      descricao: 'Sólidos geométricos e volumes',
      icone: '🧊',
      fases: [
        { numero: 1, titulo: 'Prismas', descricao: 'Área e volume', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 2, titulo: 'Pirâmides', descricao: 'Área e volume', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 3, titulo: 'Cilindros', descricao: 'Área e volume', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 4, titulo: 'Cones', descricao: 'Área e volume', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 5, titulo: 'Esferas', descricao: 'Área e volume', totalQuestoes: 10, xpRecompensa: 100 },
      ],
    },
    {
      numero: 5,
      titulo: 'Estatística e Probabilidade',
      descricao: 'Análise de dados e chances',
      icone: '📊',
      fases: [
        { numero: 1, titulo: 'Média, Moda e Mediana', descricao: 'Medidas de tendência central', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 2, titulo: 'Gráficos e Tabelas', descricao: 'Interpretação de dados', totalQuestoes: 18, xpRecompensa: 120 },
        { numero: 3, titulo: 'Probabilidade Simples', descricao: 'Espaço amostral e eventos', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 4, titulo: 'Probabilidade Condicional', descricao: 'Eventos dependentes', totalQuestoes: 12, xpRecompensa: 120 },
      ],
    },
    {
      numero: 6,
      titulo: 'Porcentagem e Matemática Financeira',
      descricao: 'Aplicações práticas do dia a dia',
      icone: '💰',
      fases: [
        { numero: 1, titulo: 'Porcentagem', descricao: 'Cálculos e aplicações', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 2, titulo: 'Juros Simples', descricao: 'Fórmulas e problemas', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 3, titulo: 'Juros Compostos', descricao: 'Montante e taxas', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 4, titulo: 'Descontos e Acréscimos', descricao: 'Aplicações comerciais', totalQuestoes: 12, xpRecompensa: 100 },
      ],
    },
    {
      numero: 7,
      titulo: 'Razão e Proporção',
      descricao: 'Grandezas e proporcionalidades',
      icone: '⚖️',
      fases: [
        { numero: 1, titulo: 'Razão e Proporção', descricao: 'Conceitos fundamentais', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 2, titulo: 'Regra de Três Simples', descricao: 'Direta e inversamente proporcional', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 3, titulo: 'Regra de Três Composta', descricao: 'Múltiplas grandezas', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 4, titulo: 'Escalas', descricao: 'Mapas e plantas', totalQuestoes: 10, xpRecompensa: 100 },
      ],
    },
    {
      numero: 8,
      titulo: 'Geometria Analítica',
      descricao: 'Plano cartesiano e equações',
      icone: '📈',
      fases: [
        { numero: 1, titulo: 'Ponto e Reta', descricao: 'Distância e equações', totalQuestoes: 15, xpRecompensa: 120 },
        { numero: 2, titulo: 'Circunferência', descricao: 'Equação e propriedades', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 3, titulo: 'Posições Relativas', descricao: 'Reta e circunferência', totalQuestoes: 10, xpRecompensa: 100 },
      ],
    },
    {
      numero: 9,
      titulo: 'Trigonometria',
      descricao: 'Relações trigonométricas',
      icone: '📐',
      fases: [
        { numero: 1, titulo: 'Trigonometria no Triângulo', descricao: 'Seno, cosseno e tangente', totalQuestoes: 15, xpRecompensa: 100 },
        { numero: 2, titulo: 'Ciclo Trigonométrico', descricao: 'Arcos e ângulos', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 3, titulo: 'Funções Trigonométricas', descricao: 'Gráficos e propriedades', totalQuestoes: 12, xpRecompensa: 120 },
      ],
    },
    {
      numero: 10,
      titulo: 'Análise Combinatória',
      descricao: 'Contagem e arranjos',
      icone: '🎲',
      fases: [
        { numero: 1, titulo: 'Princípio Fundamental', descricao: 'Multiplicativo e aditivo', totalQuestoes: 12, xpRecompensa: 100 },
        { numero: 2, titulo: 'Permutações', descricao: 'Simples e com repetição', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 3, titulo: 'Arranjos', descricao: 'Simples e com repetição', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 4, titulo: 'Combinações', descricao: 'Agrupamentos sem ordem', totalQuestoes: 12, xpRecompensa: 120 },
      ],
    },
  ],
};

// ================================================
// PLATAFORMA 2: XY OLÍMPICO
// ================================================
const XY_OLIMPICO: Plataforma = {
  slug: 'olimpico',
  nome: 'XY Olímpico',
  subtitulo: 'TREINAMENTO PARA OLIMPÍADAS',
  descricao: 'Prepare-se para as Olimpíadas de Matemática com problemas desafiadores.',
  descricaoCompleta: 'Prepare-se para OBMEP, OBM e outras olimpíadas com problemas desafiadores e técnicas avançadas. Banco de questões das últimas edições, resolução passo a passo por medalhistas, e sistema de progressão por níveis de dificuldade.',
  icone: '🏆',
  cor: '#F97316',
  corSecundaria: '#FB923C',
  features: [
    { icone: '🥇', texto: '800+ problemas de olimpíadas' },
    { icone: '📖', texto: 'Resolução por medalhistas' },
    { icone: '🎯', texto: 'Níveis: OBMEP e OBM' },
    { icone: '🧠', texto: 'Técnicas avançadas de resolução' },
    { icone: '🏅', texto: 'Simulados oficiais' },
  ],
  tags: ['OBMEP', 'OBM', 'Problemas Desafiadores'],
  stats: [
    { valor: '800+', label: 'Problemas' },
    { valor: '6', label: 'Módulos' },
    { valor: '10', label: 'Simulados' },
  ],
  modulos: [
    {
      numero: 1,
      titulo: 'Teoria dos Números',
      descricao: 'Divisibilidade, primos e congruências',
      icone: '🔢',
      fases: [
        { numero: 1, titulo: 'Divisibilidade', descricao: 'Critérios e propriedades', totalQuestoes: 15, xpRecompensa: 150 },
        { numero: 2, titulo: 'Números Primos', descricao: 'Crivo e fatoração', totalQuestoes: 15, xpRecompensa: 150 },
        { numero: 3, titulo: 'MDC e MMC', descricao: 'Algoritmo de Euclides', totalQuestoes: 12, xpRecompensa: 120 },
        { numero: 4, titulo: 'Congruências', descricao: 'Aritmética modular', totalQuestoes: 15, xpRecompensa: 180 },
        { numero: 5, titulo: 'Equações Diofantinas', descricao: 'Soluções inteiras', totalQuestoes: 12, xpRecompensa: 180 },
      ],
    },
    {
      numero: 2,
      titulo: 'Geometria Olímpica',
      descricao: 'Técnicas avançadas de geometria',
      icone: '📐',
      fases: [
        { numero: 1, titulo: 'Congruência e Semelhança', descricao: 'Casos e aplicações', totalQuestoes: 15, xpRecompensa: 150 },
        { numero: 2, titulo: 'Circunferências', descricao: 'Potência de ponto e eixos radicais', totalQuestoes: 15, xpRecompensa: 180 },
        { numero: 3, titulo: 'Pontos Notáveis', descricao: 'Ortocentro, incentro, circuncentro', totalQuestoes: 12, xpRecompensa: 150 },
        { numero: 4, titulo: 'Teoremas Clássicos', descricao: 'Menelaus, Ceva, Stewart', totalQuestoes: 15, xpRecompensa: 200 },
        { numero: 5, titulo: 'Transformações', descricao: 'Homotetia e inversão', totalQuestoes: 12, xpRecompensa: 180 },
      ],
    },
    {
      numero: 3,
      titulo: 'Combinatória',
      descricao: 'Contagem e princípios avançados',
      icone: '🎲',
      fases: [
        { numero: 1, titulo: 'Princípios de Contagem', descricao: 'Bijeções e dupla contagem', totalQuestoes: 15, xpRecompensa: 150 },
        { numero: 2, titulo: 'Permutações e Combinações', descricao: 'Técnicas avançadas', totalQuestoes: 15, xpRecompensa: 150 },
        { numero: 3, titulo: 'Princípio das Gavetas', descricao: 'Pigeonhole Principle', totalQuestoes: 12, xpRecompensa: 180 },
        { numero: 4, titulo: 'Recorrências', descricao: 'Sequências e padrões', totalQuestoes: 12, xpRecompensa: 180 },
        { numero: 5, titulo: 'Grafos', descricao: 'Introdução à teoria dos grafos', totalQuestoes: 15, xpRecompensa: 200 },
      ],
    },
    {
      numero: 4,
      titulo: 'Álgebra Olímpica',
      descricao: 'Equações e desigualdades',
      icone: '➕',
      fases: [
        { numero: 1, titulo: 'Equações Polinomiais', descricao: 'Raízes e fatoração', totalQuestoes: 15, xpRecompensa: 150 },
        { numero: 2, titulo: 'Desigualdades Clássicas', descricao: 'AM-GM, Cauchy-Schwarz', totalQuestoes: 15, xpRecompensa: 180 },
        { numero: 3, titulo: 'Funções', descricao: 'Equações funcionais', totalQuestoes: 12, xpRecompensa: 200 },
        { numero: 4, titulo: 'Sequências', descricao: 'PA, PG e recorrências', totalQuestoes: 15, xpRecompensa: 150 },
        { numero: 5, titulo: 'Polinômios', descricao: 'Divisão e identidades', totalQuestoes: 12, xpRecompensa: 180 },
      ],
    },
    {
      numero: 5,
      titulo: 'Problemas OBMEP',
      descricao: 'Questões específicas da OBMEP',
      icone: '🥇',
      fases: [
        { numero: 1, titulo: 'Nível 1 - Fase 1', descricao: '6º e 7º ano', totalQuestoes: 20, xpRecompensa: 150 },
        { numero: 2, titulo: 'Nível 1 - Fase 2', descricao: '6º e 7º ano', totalQuestoes: 15, xpRecompensa: 180 },
        { numero: 3, titulo: 'Nível 2 - Fase 1', descricao: '8º e 9º ano', totalQuestoes: 20, xpRecompensa: 150 },
        { numero: 4, titulo: 'Nível 2 - Fase 2', descricao: '8º e 9º ano', totalQuestoes: 15, xpRecompensa: 180 },
        { numero: 5, titulo: 'Nível 3 - Fase 1', descricao: 'Ensino Médio', totalQuestoes: 20, xpRecompensa: 180 },
        { numero: 6, titulo: 'Nível 3 - Fase 2', descricao: 'Ensino Médio', totalQuestoes: 15, xpRecompensa: 200 },
      ],
    },
    {
      numero: 6,
      titulo: 'Problemas OBM',
      descricao: 'Questões da Olimpíada Brasileira',
      icone: '🏆',
      fases: [
        { numero: 1, titulo: 'OBM Júnior', descricao: 'Até 8º ano', totalQuestoes: 15, xpRecompensa: 180 },
        { numero: 2, titulo: 'OBM Nível 1', descricao: '8º e 9º ano', totalQuestoes: 15, xpRecompensa: 200 },
        { numero: 3, titulo: 'OBM Nível 2', descricao: '1º e 2º EM', totalQuestoes: 15, xpRecompensa: 220 },
        { numero: 4, titulo: 'OBM Nível 3', descricao: '3º EM', totalQuestoes: 15, xpRecompensa: 250 },
      ],
    },
  ],
};

// ================================================
// PLATAFORMA 3: XY EDUCAÇÃO FINANCEIRA
// ================================================
const XY_FINANCEIRO: Plataforma = {
  slug: 'financeiro',
  nome: 'XY Educação Financeira',
  subtitulo: 'DOMINE SUAS FINANÇAS',
  descricao: 'Aprenda educação financeira de forma gamificada e prática.',
  descricaoCompleta: 'Transforme sua relação com o dinheiro. Aprenda desde o básico de orçamento até investimentos, com questões práticas do dia a dia, simulações financeiras e um sistema de progressão que te leva da situação atual até a independência financeira.',
  icone: '💰',
  cor: '#22C55E',
  corSecundaria: '#4ADE80',
  features: [
    { icone: '📊', texto: '200+ questões práticas' },
    { icone: '🎮', texto: 'Aprendizado gamificado' },
    { icone: '💡', texto: 'Situações do dia a dia' },
    { icone: '📈', texto: 'Do básico ao investimento' },
    { icone: '🏆', texto: 'Conquistas e níveis' },
  ],
  tags: ['Orçamento', 'Investimentos', 'Dívidas'],
  stats: [
    { valor: '200+', label: 'Questões' },
    { valor: '6', label: 'Mundos' },
    { valor: '26', label: 'Fases' },
  ],
  modulos: [
    {
      numero: 1,
      titulo: 'Mentalidade Financeira',
      descricao: 'Transforme sua relação com o dinheiro',
      icone: '🧠',
      fases: [
        { numero: 1, titulo: 'O que é dinheiro?', descricao: 'Conceito e funções do dinheiro', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 2, titulo: 'Crenças sobre dinheiro', descricao: 'Crenças limitantes', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 3, titulo: 'Objetivos financeiros', descricao: 'Metas SMART', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 4, titulo: 'Hábitos financeiros', descricao: 'Comportamentos saudáveis', totalQuestoes: 8, xpRecompensa: 100 },
      ],
    },
    {
      numero: 2,
      titulo: 'Orçamento e Controle',
      descricao: 'Domine suas receitas e despesas',
      icone: '📊',
      fases: [
        { numero: 1, titulo: 'Receitas e despesas', descricao: 'Entradas e saídas', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 2, titulo: 'Método 50-30-20', descricao: 'Divisão do orçamento', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 3, titulo: 'Controle diário', descricao: 'Ferramentas de controle', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 4, titulo: 'Despesas fixas vs variáveis', descricao: 'Classificação de gastos', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 5, titulo: 'Revisão mensal', descricao: 'Análise do mês', totalQuestoes: 8, xpRecompensa: 100 },
      ],
    },
    {
      numero: 3,
      titulo: 'Dívidas e Crédito',
      descricao: 'Livre-se das dívidas',
      icone: '💳',
      fases: [
        { numero: 1, titulo: 'Tipos de dívidas', descricao: 'Boas vs más dívidas', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 2, titulo: 'Juros compostos', descricao: 'O inimigo invisível', totalQuestoes: 10, xpRecompensa: 150 },
        { numero: 3, titulo: 'Cartão de crédito', descricao: 'Uso consciente', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 4, titulo: 'Estratégia bola de neve', descricao: 'Método de quitação', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 5, titulo: 'Renegociação', descricao: 'Negociar dívidas', totalQuestoes: 6, xpRecompensa: 100 },
      ],
    },
    {
      numero: 4,
      titulo: 'Poupança e Reserva',
      descricao: 'Construa sua segurança',
      icone: '🐷',
      fases: [
        { numero: 1, titulo: 'Por que poupar?', descricao: 'Importância da poupança', totalQuestoes: 6, xpRecompensa: 100 },
        { numero: 2, titulo: 'Reserva de emergência', descricao: '6 meses de gastos', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 3, titulo: 'Quanto guardar', descricao: 'Percentuais ideais', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 4, titulo: 'Onde deixar a reserva', descricao: 'Liquidez e segurança', totalQuestoes: 8, xpRecompensa: 100 },
      ],
    },
    {
      numero: 5,
      titulo: 'Investimentos Básicos',
      descricao: 'Faça seu dinheiro trabalhar',
      icone: '📈',
      fases: [
        { numero: 1, titulo: 'O que são investimentos', descricao: 'Conceitos básicos', totalQuestoes: 6, xpRecompensa: 100 },
        { numero: 2, titulo: 'Perfil de investidor', descricao: 'Conservador a arrojado', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 3, titulo: 'Renda fixa', descricao: 'Tesouro, CDB, LCI/LCA', totalQuestoes: 10, xpRecompensa: 150 },
        { numero: 4, titulo: 'Renda variável', descricao: 'Ações e fundos', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 5, titulo: 'Diversificação', descricao: 'Não colocar tudo numa cesta', totalQuestoes: 6, xpRecompensa: 100 },
      ],
    },
    {
      numero: 6,
      titulo: 'Planejamento de Longo Prazo',
      descricao: 'Garanta seu futuro',
      icone: '🎯',
      fases: [
        { numero: 1, titulo: 'Aposentadoria', descricao: 'INSS e complementar', totalQuestoes: 8, xpRecompensa: 100 },
        { numero: 2, titulo: 'Previdência privada', descricao: 'PGBL vs VGBL', totalQuestoes: 6, xpRecompensa: 100 },
        { numero: 3, titulo: 'Independência financeira', descricao: 'Viver de renda', totalQuestoes: 6, xpRecompensa: 150 },
      ],
    },
  ],
};

// ================================================
// PLATAFORMA 4: XY PREPARATÓRIO IFPI
// ================================================
const XY_IFPI: Plataforma = {
  slug: 'ifpi',
  nome: 'XY Preparatório IFPI',
  subtitulo: 'SUA VAGA NO INSTITUTO FEDERAL',
  descricao: 'Preparação completa para o processo seletivo do IFPI.',
  descricaoCompleta: 'Conquiste sua vaga no Instituto Federal do Piauí com uma preparação focada e direcionada. Provas anteriores comentadas, simulados no formato oficial, apostilas exclusivas e acompanhamento de progresso para Matemática e Português.',
  icone: '🎯',
  cor: '#A855F7',
  corSecundaria: '#C084FC',
  features: [
    { icone: '📚', texto: '4 módulos completos' },
    { icone: '📝', texto: 'Provas anteriores comentadas' },
    { icone: '📄', texto: 'Apostilas em PDF' },
    { icone: '⏱️', texto: 'Simulados formato IFPI' },
    { icone: '📊', texto: 'Matemática + Português' },
  ],
  tags: ['IFPI', 'Instituto Federal', 'Processo Seletivo'],
  stats: [
    { valor: '160+', label: 'Questões' },
    { valor: '4', label: 'Módulos' },
    { valor: '5', label: 'Simulados' },
  ],
  modulos: [
    {
      numero: 1,
      titulo: 'Módulo 1 - Fundamentos',
      descricao: 'Base para Matemática e Português',
      icone: '📖',
      fases: [
        { numero: 1, titulo: 'Operações Matemáticas', descricao: 'Fundamentos de matemática', totalQuestoes: 10, xpRecompensa: 100 },
        { numero: 2, titulo: 'Interpretação de Texto', descricao: 'Fundamentos de português', totalQuestoes: 10, xpRecompensa: 100 },
        { numero: 3, titulo: 'Simulado Módulo 1', descricao: '20 questões mistas', totalQuestoes: 20, xpRecompensa: 150 },
      ],
    },
    {
      numero: 2,
      titulo: 'Módulo 2 - Intermediário',
      descricao: 'Aprofundamento dos conteúdos',
      icone: '📚',
      fases: [
        { numero: 1, titulo: 'Álgebra e Geometria', descricao: 'Equações e formas', totalQuestoes: 10, xpRecompensa: 100 },
        { numero: 2, titulo: 'Gramática e Redação', descricao: 'Normas e escrita', totalQuestoes: 10, xpRecompensa: 100 },
        { numero: 3, titulo: 'Simulado Módulo 2', descricao: '20 questões mistas', totalQuestoes: 20, xpRecompensa: 150 },
      ],
    },
    {
      numero: 3,
      titulo: 'Módulo 3 - Avançado',
      descricao: 'Temas mais cobrados',
      icone: '🎓',
      fases: [
        { numero: 1, titulo: 'Problemas e Raciocínio', descricao: 'Questões complexas', totalQuestoes: 10, xpRecompensa: 120 },
        { numero: 2, titulo: 'Literatura e Gêneros', descricao: 'Textos e estilos', totalQuestoes: 10, xpRecompensa: 120 },
        { numero: 3, titulo: 'Simulado Módulo 3', descricao: '20 questões mistas', totalQuestoes: 20, xpRecompensa: 150 },
      ],
    },
    {
      numero: 4,
      titulo: 'Módulo 4 - Revisão Final',
      descricao: 'Preparação para a prova',
      icone: '🏆',
      fases: [
        { numero: 1, titulo: 'Revisão Matemática', descricao: 'Revisão completa', totalQuestoes: 10, xpRecompensa: 120 },
        { numero: 2, titulo: 'Revisão Português', descricao: 'Revisão completa', totalQuestoes: 10, xpRecompensa: 120 },
        { numero: 3, titulo: 'Simulado Final', descricao: '40 questões formato IFPI', totalQuestoes: 40, xpRecompensa: 250 },
      ],
    },
  ],
};

// ================================================
// EXPORTAÇÃO DAS PLATAFORMAS
// ================================================
export const PLATAFORMAS: Plataforma[] = [
  XY_MATEMATICA_ENEM,
  XY_OLIMPICO,
  XY_FINANCEIRO,
  XY_IFPI,
];

export const getPlataformaBySlug = (slug: PlataformaSlug): Plataforma | undefined => {
  return PLATAFORMAS.find(p => p.slug === slug);
};

export const getPlataformaCor = (slug: PlataformaSlug): string => {
  const cores: Record<PlataformaSlug, string> = {
    enem: '#3B82F6',
    olimpico: '#F97316',
    financeiro: '#22C55E',
    ifpi: '#A855F7',
  };
  return cores[slug];
};

// ================================================
// ESTATÍSTICAS GLOBAIS
// ================================================
export const STATS_GLOBAIS = {
  totalQuestoes: PLATAFORMAS.reduce((acc, p) => 
    acc + p.modulos.reduce((acc2, m) => 
      acc2 + m.fases.reduce((acc3, f) => acc3 + f.totalQuestoes, 0), 0), 0),
  totalModulos: PLATAFORMAS.reduce((acc, p) => acc + p.modulos.length, 0),
  totalFases: PLATAFORMAS.reduce((acc, p) => 
    acc + p.modulos.reduce((acc2, m) => acc2 + m.fases.length, 0), 0),
  totalPlataformas: PLATAFORMAS.length,
};

// Aproximadamente: 2.500+ questões, 26 módulos, 85+ fases, 4 plataformas
