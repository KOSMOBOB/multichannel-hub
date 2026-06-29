'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LangContext';
import { Lang } from '@/lib/i18n';

// Настройки профиля: имя, язык интерфейса, смена пароля
export default function ProfilePage() {
  const { t, lang, setLang } = useLang();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  useEffect(() => {
    api.get('/auth/me').then((r) => {
      setName(r.data.name || '');
      setEmail(r.data.email);
      if (r.data.language) setLang(r.data.language as Lang);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.put('/users/me', { name, language: lang });
    setMsg(t('saved'));
    setTimeout(() => setMsg(''), 2000);
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg('');
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setPwdMsg(t('saved'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwdMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('profile')}</h1>

      <form onSubmit={saveProfile} className="bg-white rounded-xl shadow p-5 mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">{t('email')}</label>
          <input value={email} disabled className="w-full border rounded px-3 py-2 bg-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('name')}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('language')}</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="ru">Русский</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <button type="submit" className="bg-brand text-white px-4 py-2 rounded">
          {t('save')}
        </button>
        {msg && <span className="ml-3 text-green-600 text-sm">{msg}</span>}
      </form>

      <form onSubmit={changePassword} className="bg-white rounded-xl shadow p-5 space-y-4">
        <h2 className="font-semibold">{t('changePassword')}</h2>
        <div>
          <label className="block text-sm font-medium mb-1">{t('currentPassword')}</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">{t('newPassword')}</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <button type="submit" className="bg-brand text-white px-4 py-2 rounded">
          {t('changePassword')}
        </button>
        {pwdMsg && <span className="ml-3 text-sm text-green-600">{pwdMsg}</span>}
      </form>
    </div>
  );
}
