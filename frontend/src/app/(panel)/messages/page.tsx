'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LangContext';

// История сообщений с фильтрацией по каналу
export default function MessagesPage() {
  const { t } = useLang();
  const [messages, setMessages] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [channelId, setChannelId] = useState('');

  const load = () => {
    const params = channelId ? { channelId } : {};
    api.get('/messages', { params }).then((r) => setMessages(r.data.items)).catch(() => {});
  };

  useEffect(() => {
    api.get('/channels').then((r) => setChannels(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('messages')}</h1>
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">{t('allChannels')}</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3">{t('date')}</th>
              <th className="px-4 py-3">{t('direction')}</th>
              <th className="px-4 py-3">{t('sender')}</th>
              <th className="px-4 py-3">{t('text')}</th>
            </tr>
          </thead>
          <tbody>
            {messages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  {t('noData')}
                </td>
              </tr>
            )}
            {messages.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                  {new Date(m.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {m.direction === 'INBOUND' ? t('inbound') : t('outbound')}
                </td>
                <td className="px-4 py-3">{m.senderName || m.senderId || '—'}</td>
                <td className="px-4 py-3 max-w-md truncate">{m.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
