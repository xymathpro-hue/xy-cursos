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
      <head>
        <link 
          rel="stylesheet" 
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" 
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV" 
          crossOrigin="anonymous"
        />
        <script 
          defer 
          src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" 
          integrity="sha384-XjKyOOlGwcjNTAIQHIpgOno0Ber8vR0c9Z1EqpfQrj+MkPJBwU+TN9LH6PAI5u7R" 
          crossOrigin="anonymous"
        />
        <script 
          defer 
          src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" 
          integrity="sha384-+VBxd3r6XgURycqtZ117nYw44OOcIax56Z4dCRWbxyPt0Koah1uHoK0o4+/RRE05" 
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
