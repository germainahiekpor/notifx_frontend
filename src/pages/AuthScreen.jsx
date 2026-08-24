import React, { useState } from 'react';
import { S, makeApi } from '../utils';
import Spinner from '../components/atoms/Spinner';
import Alert from '../components/atoms/Alert';
import Field from '../components/atoms/Field';

export default function AuthScreen({ onAuth }) {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Email and password fields are required');
    if (tab === 'signup' && !form.name) return setError('Profile display name is required');

    setLoading(true);
    setError('');
    try {
      const authApi = makeApi(null);
      if (tab === 'signup') {
        await authApi('/signup', { method: 'POST', body: form });
      }
      const { token } = await authApi('/login', { method: 'POST', body: { email: form.email, password: form.password } });
      onAuth(token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div className="fu" style={{ width: '100%', maxWidth: 400, background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px 24px' }}>
        <div style={{ marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--fd)', fontSize: 24, fontWeight: 800, color: 'var(--a)' }}>NOTIFX</span>
          <span style={{ fontFamily: 'var(--fd)', fontSize: 24, color: 'var(--text)' }}></span>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 24 }}>Please sign in to connect to people.</p>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
          {['login', 'signup'].map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(''); }} style={{ padding: '8px 12px', background: 'none', border: 'none', color: tab === t ? 'var(--a)' : 'var(--muted)', borderBottom: `2px solid ${tab === t ? 'var(--a)' : 'transparent'}`, fontSize: 11, textTransform: 'uppercase', cursor: 'pointer', marginRight: 12 }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <Alert type="error" msg={error} />

        <form onSubmit={handleSubmit}>
          {tab === 'signup' && <Field label="User Name" value={form.name} onChange={set('name')} placeholder="John Doe" required />}
          <Field label="Email Address" type="email" value={form.email} onChange={set('email')} placeholder="name@domain.com" required />
          {tab === 'signup' && <Field label="Phone Contact (Optional)" value={form.phone} onChange={set('phone')} placeholder="+123456789" />}
          <Field label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••" required />

          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? <Spinner size={14} color="#000" /> : tab === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}