'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LangContext';

// Настройки вебхуков для интеграции с внешними системами
export default function WebhooksPage() {
  const { t } = useLang();
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');

  const load = () => api.get('/webhooks').then((r) => setWebhooks(r.data)).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/webhooks', { name, url, secret: secret || undefined, events: ['message.received'] });
    setName('');
    setUrl('');
    setSecret('');
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/webhooks/${id}`);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('webhooks')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          {t('addWebhook')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-white rounded-xl shadow p-5 mb-6 space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">{t('name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('url')}</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="https://n8n.example.com/webhook/..."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('secret')}</label>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-brand text-white px-4 py-2 rounded">
              {t('create')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded border">
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('name')}</th>
              <th className="px-4 py-3">{t('url')}</th>
              <th className="px-4 py-3">{t('events')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  {t('noData')}
                </td>
              </tr>
            )}
            {webhooks.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="px-4 py-3 font-medium">{w.name}</td>
                <td className="px-4 py-3 max-w-xs truncate">{w.url}</td>
                <td className="px-4 py-3">{(w.events || []).join(', ')}</td>
                <td className="px-4 py-3">
                  <button onClick={() => remove(w.id)} className="text-red-600 hover:underline">
                    {t('delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
