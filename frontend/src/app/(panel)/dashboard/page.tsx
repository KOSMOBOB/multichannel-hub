'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LangContext';

// Дашборд с общей статистикой
export default function DashboardPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/messages/stats').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  const cards = [
    { label: t('totalMessages'), value: stats?.totalMessages ?? '—' },
    { label: t('totalChannels'), value: stats?.totalChannels ?? '—' },
    { label: t('activeChannels'), value: stats?.activeChannels ?? '—' },
    { label: t('totalWebhooks'), value: stats?.totalWebhooks ?? '—' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('dashboard')}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow p-5">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-3xl font-bold mt-2 text-brand">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
