'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLang } from '@/lib/LangContext';
import LanguageSwitcher from './LanguageSwitcher';

// Боковое меню навигации админ-панели
export default function Sidebar() {
  const { t } = useLang();
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: '/dashboard', label: t('dashboard') },
    { href: '/channels', label: t('channels') },
    { href: '/messages', label: t('messages') },
    { href: '/webhooks', label: t('webhooks') },
    { href: '/profile', label: t('profile') },
  ];

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <aside className="w-60 bg-white border-r min-h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold text-brand">{t('appName')}</h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded text-sm font-medium ${
              pathname === item.href ? 'bg-brand text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t space-y-2">
        <LanguageSwitcher />
        <button
          onClick={logout}
          className="w-full text-left px-3 py-2 rounded text-sm text-red-600 hover:bg-red-50"
        >
          {t('signOut')}
        </button>
      </div>
    </aside>
  );
}
