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
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string>('');
  
  // Тестирование сообщений
  const [testChannelId, setTestChannelId] = useState<string | null>(null);
  const [testMessages, setTestMessages] = useState<any[]>([]);
  const [testRecipient, setTestRecipient] = useState('');
  const [testText, setTestText] = useState('');

  const load = () => api.get('/channels').then((r) => setChannels(r.data)).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  // Определить, является ли Telegram-канал пользовательским (QR), а не ботом
  const isTgUser = (c: any) => c.type === 'TELEGRAM' && c.config?.mode === 'userbot';

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    let payload: any;
    if (type === 'TELEGRAM') {
      payload = { name, type: 'TELEGRAM', config: { token } };
    } else if (type === 'TELEGRAM_USER') {
      // Пользовательский Telegram (QR) хранится как тип TELEGRAM с пометкой mode=userbot
      payload = { name, type: 'TELEGRAM', config: { mode: 'userbot', apiId, apiHash } };
    } else {
      payload = { name, type, config: {} };
    }
    await api.post('/channels', payload);
    setName('');
    setToken('');
    setApiId('');
    setApiHash('');
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

  const initializeTgUser = async (id: string) => {
    try {
      await api.post(`/telegram-user/channels/${id}/initialize`);
      alert(t('saved'));
      setTimeout(() => getTgUserQR(id), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const getTgUserQR = async (id: string) => {
    try {
      const res = await api.get(`/telegram-user/channels/${id}/qr`);
      setQrCode(res.data.qr || null);
      setWaStatus(res.data.status || '');
      if (res.data.qr) {
        alert(t('scanQRTg'));
      } else if (res.data.status === 'NEEDS_PASSWORD') {
        submitTgPassword(id);
      } else {
        alert(t('tgUserStatus') + ': ' + res.data.status);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  const getTgUserStatus = async (id: string) => {
    try {
      const res = await api.get(`/telegram-user/channels/${id}/status`);
      if (res.data.status === 'NEEDS_PASSWORD') {
        submitTgPassword(id);
        return;
      }
      alert(t('tgUserStatus') + ': ' + res.data.status);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  // Запросить у пользователя пароль 2FA и отправить его на сервер
  const submitTgPassword = async (id: string) => {
    const password = window.prompt(t('tgUserEnterPassword'));
    if (!password) return;
    try {
      await api.post(`/telegram-user/channels/${id}/password`, { password });
      alert(t('saved'));
      setTimeout(() => getTgUserStatus(id), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error');
    }
  };

  // Тестирование сообщений
  const openTest = async (channelId: string) => {
    setTestChannelId(channelId);
    setTestRecipient('');
    setTestText('');
    await loadTestMessages(channelId);
  };

  const closeTest = () => {
    setTestChannelId(null);
    setTestMessages([]);
    setTestRecipient('');
    setTestText('');
  };

  const loadTestMessages = async (channelId: string) => {
    try {
      const res = await api.get(`/messages?channelId=${channelId}`);
      setTestMessages(res.data.slice(0, 10)); // последние 10
    } catch (err: any) {
      console.error('Error loading test messages:', err);
    }
  };

  const sendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testChannelId || !testText.trim()) return;

    const channel = channels.find((c) => c.id === testChannelId);
    if (!channel) return;

    try {
      if (channel.type === 'TELEGRAM' && !isTgUser(channel)) {
        // Telegram Bot
        await api.post(`/telegram/channels/${testChannelId}/send`, {
          chatId: testRecipient,
          text: testText,
        });
      } else if (isTgUser(channel)) {
        // Telegram User (QR)
        await api.post(`/telegram-user/channels/${testChannelId}/send`, {
          peer: testRecipient,
          text: testText,
        });
      } else if (channel.type === 'WHATSAPP') {
        // WhatsApp
        await api.post(`/whatsapp/channels/${testChannelId}/send`, {
          to: testRecipient,
          text: testText,
        });
      }
      alert(t('messageSent'));
      setTestText('');
      await loadTestMessages(testChannelId);
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
              <option value="TELEGRAM">Telegram (бот / bot)</option>
              <option value="TELEGRAM_USER">Telegram (QR)</option>
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
          {type === 'TELEGRAM_USER' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('tgUserApiId')}</label>
                <input
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="1234567"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('tgUserApiHash')}</label>
                <input
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  placeholder="0123456789abcdef0123456789abcdef"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">{t('tgUserHint')}</p>
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
                <td className="px-4 py-3">{isTgUser(c) ? 'TELEGRAM (QR)' : c.type}</td>
                <td className="px-4 py-3">
                  <span className={c.isActive ? 'text-green-600' : 'text-gray-400'}>
                    {c.isActive ? t('active') : t('inactive')}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-3">
                  {c.type === 'TELEGRAM' && !isTgUser(c) && (
                    <button onClick={() => setWebhook(c.id)} className="text-brand hover:underline">
                      {t('setWebhookTg')}
                    </button>
                  )}
                  {isTgUser(c) && (
                    <>
                      <button onClick={() => initializeTgUser(c.id)} className="text-brand hover:underline">
                        {t('initializeTgUser')}
                      </button>
                      <button onClick={() => getTgUserQR(c.id)} className="text-green-600 hover:underline">
                        {t('getQR')}
                      </button>
                      <button onClick={() => getTgUserStatus(c.id)} className="text-blue-600 hover:underline">
                        {t('tgUserStatus')}
                      </button>
                    </>
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
                  {(c.type === 'TELEGRAM' || c.type === 'WHATSAPP') && (
                    <button onClick={() => openTest(c.id)} className="text-purple-600 hover:underline">
                      {t('testMessages')}
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

      {/* Модальное окно тестирования сообщений */}
      {testChannelId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('testMessages')}</h2>
              <button onClick={closeTest} className="text-gray-400 hover:text-gray-600 text-2xl">
                &times;
              </button>
            </div>

            {/* История сообщений */}
            <div className="flex-1 overflow-y-auto mb-4 border rounded p-3 bg-gray-50 space-y-2 min-h-[200px] max-h-[400px]">
              {testMessages.length === 0 && (
                <p className="text-center text-gray-400 py-4">{t('noMessages')}</p>
              )}
              {testMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded ${
                    msg.direction === 'OUTBOUND' ? 'bg-blue-100 ml-8' : 'bg-white mr-8'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-600">
                      {msg.direction === 'OUTBOUND' ? t('outbound') : t('inbound')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {msg.sender && (
                    <div className="text-xs text-gray-500 mb-1">
                      {t('from')}: {msg.sender}
                    </div>
                  )}
                  <div className="text-sm">{msg.text}</div>
                </div>
              ))}
            </div>

            {/* Форма отправки */}
            <form onSubmit={sendTestMessage} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('recipient')}</label>
                <input
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder={t('recipientPlaceholder')}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('message')}</label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={3}
                  placeholder={t('messageText')}
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark">
                  {t('send')}
                </button>
                <button
                  type="button"
                  onClick={() => loadTestMessages(testChannelId)}
                  className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                >
                  {t('refresh')}
                </button>
                <button type="button" onClick={closeTest} className="px-4 py-2 rounded border">
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
