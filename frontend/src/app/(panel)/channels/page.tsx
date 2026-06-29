'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LangContext';

// Управление каналами: список, добавление Telegram-ботов, WhatsApp и веб-форм
export default function ChannelsPage() {
  const { t } = useLang();
  const [channels, setChannels] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('TELEGRAM');
  const [token, setToken] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string>('');

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

  const initializeWhatsApp = async (id: string) => {
    try {
      await api.post(`/whatsapp/channels/${id}/initialize`);
      alert(t('saved'));
      setTimeout(() => getWhatsAppQR(id), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const getWhatsAppQR = async (id: string) => {
    try {
      const res = await api.get(`/whatsapp/channels/${id}/qr`);
      setQrCode(res.data.qr || null);
      setWaStatus(res.data.status || '');
      if (res.data.qr) {
        alert(t('scanQR'));
      } else {
        alert(t('waStatus') + ': ' + res.data.status);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const getWhatsAppStatus = async (id: string) => {
    try {
      const res = await api.get(`/whatsapp/channels/${id}/status`);
      alert(t('waStatus') + ': ' + res.data.status);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
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
              <option value="WHATSAPP">WhatsApp</option>
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

      {qrCode && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-bold mb-3">{t('scanQR')}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('waStatus')}: {waStatus}
          </p>
          <img src={qrCode} alt="WhatsApp QR Code" className="border p-2" />
          <button
            onClick={() => setQrCode(null)}
            className="mt-4 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            {t('cancel')}
          </button>
        </div>
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
                  {c.type === 'WHATSAPP' && (
                    <>
                      <button onClick={() => initializeWhatsApp(c.id)} className="text-brand hover:underline">
                        {t('initializeWA')}
                      </button>
                      <button onClick={() => getWhatsAppQR(c.id)} className="text-green-600 hover:underline">
                        {t('getQR')}
                      </button>
                      <button onClick={() => getWhatsAppStatus(c.id)} className="text-blue-600 hover:underline">
                        {t('waStatus')}
                      </button>
                    </>
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
