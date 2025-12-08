import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'XY Cursos | Plataforma Integrada de Estudos',
    template: '%s | XY Cursos',
  },
  description: 'Sua aprovação começa aqui e agora.',
  keywords: ['ENEM', 'Matemática', 'Olimpíadas', 'IFPI', 'Preparatório'],
  authors: [{ name: 'XY Cursos' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$']],
                  displayMath: [['$$', '$$']],
                },
                svg: {
                  fontCache: 'global'
                }
              };
            `,
          }}
        />
        <script
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          async
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
