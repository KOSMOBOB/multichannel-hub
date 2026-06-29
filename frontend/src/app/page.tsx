'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Корневая страница: редирект на дашборд или логин
export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = typeof window !== 'undefined' && localStorage.getItem('token');
    router.replace(token ? '/dashboard' : '/login');
  }, [router]);
  return null;
}
