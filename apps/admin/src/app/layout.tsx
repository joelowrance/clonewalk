import type { Metadata } from 'next';
import { Newsreader } from 'next/font/google';
import './globals.css';

const serif = Newsreader({ subsets: ['latin'], weight: ['400', '500'], variable: '--serif' });

export const metadata: Metadata = {
  title: 'Compliance Admin',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ '--serif': serif.style.fontFamily } as React.CSSProperties}>
      <body className={serif.variable}>{children}</body>
    </html>
  );
}
