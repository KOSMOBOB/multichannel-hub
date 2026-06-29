import './globals.css';
import type { Metadata } from 'next';
import { LangProvider } from '@/lib/LangContext';

export const metadata: Metadata = {
  title: 'Multichannel Hub',
  description: 'Омниканальный шлюз — админ-панель',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
