'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LangContext';

// Управление каналами: список, добавление Telegram-ботов и веб-форм
export default function ChannelsPage() {
  const { t } = useLang();
  const [channels, setChannels] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('TELEGRAM');
  const [token, setToken] = useState('');

  const load = () => api.get('/channels').then((r) => setChannels(r.data)).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = type === 'TELEGRAM' ? { token } : {};
    await api.post('/channels', { name, type, config });
    setName('');
    setToken('');
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/channels/${id}`);
    load();
  };

  const setWebhook = async (id: string) => {
    const publicUrl = window.prompt('Public URL (https://...)');
    if (!publicUrl) return;
    await api.post(`/telegram/channels/${id}/set-webhook`, { publicUrl });
    alert(t('saved'));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('channels')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark"
        >
          {t('addChannel')}
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
            <label className="block text-sm font-medium mb-1">{t('type')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="TELEGRAM">Telegram</option>
              <option value="WEBFORM">Web Form</option>
            </select>
          </div>
          {type === 'TELEGRAM' && (
            <div>
              <label className="block text-sm font-medium mb-1">{t('telegramToken')}</label>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="123456:ABC-DEF..."
              />
            </div>
          )}
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
              <th className="px-4 py-3">{t('type')}</th>
              <th className="px-4 py-3">{t('status')}</th>
              <th className="px-4 py-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {channels.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  {t('noData')}
                </td>
              </tr>
            )}
            {channels.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.type}</td>
                <td className="px-4 py-3">
                  <span className={c.isActive ? 'text-green-600' : 'text-gray-400'}>
                    {c.isActive ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-3">
                  {c.type === 'TELEGRAM' && (
                    <button onClick={() => setWebhook(c.id)} className="text-brand hover:underline">
                      {t('setWebhookTg')}
                    </button>
                  )}
                  <button onClick={() => remove(c.id)} className="text-red-600 hover:underline">
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
