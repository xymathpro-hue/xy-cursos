import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'XY Cursos | Plataforma Integrada de Estudos',
    template: '%s | XY Cursos',
  },
  description: 'Sua aprovação começa aqui e agora. Três plataformas especializadas para você conquistar seus objetivos: ENEM, Olimpíadas de Matemática e IFPI.',
  keywords: ['ENEM', 'Matemática', 'Olimpíadas', 'IFPI', 'Preparatório', 'Estudos', 'Educação'],
  authors: [{ name: 'XY Cursos' }],
  openGraph: {
    title: 'XY Cursos | Plataforma Integrada de Estudos',
    description: 'Sua aprovação começa aqui e agora.',
    url: 'https://xycursos.com.br',
    siteName: 'XY Cursos',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
