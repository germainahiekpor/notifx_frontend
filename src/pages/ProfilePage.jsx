import React, { useState, useRef } from 'react';
import { Save, Trash2, Upload, X } from 'lucide-react';
import { S, initials, makeApi } from '../utils';
import { BASE } from '../constants';
import Alert from '../components/atoms/Alert';
import Field from '../components/atoms/Field';
import Spinner from '../components/atoms/Spinner';

export default function ProfilePage({ api, me, onUpdate, onDelete }) {
  const [form, setForm] = useState({
    name: me?.name || '',
    email: me?.email || '',
    phone: me?.phone || '',
    bio: me?.bio || '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(me?.avatar_url || null);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const avatarInputRef = useRef(null);

  const getAvatarUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUploading(true);
    setStatus({ type: '', msg: '' });
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api('/users/avatar', { method: 'POST', body: fd, multipart: true });
      onUpdate({ ...me, avatar_url: res.avatar_url });
      setAvatarPreview(getAvatarUrl(res.avatar_url));
      setStatus({ type: 'success', msg: 'Avatar updated.' });
    } catch (err) {
      setStatus({ type: 'error', msg: 'Avatar upload failed: ' + err.message });
      setAvatarPreview(getAvatarUrl(me?.avatar_url));
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const updated = await api(`/users/${me.id}`, { method: 'PUT', body: form });
      onUpdate(updated);
      setStatus({ type: 'success', msg: 'Profile saved.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const terminateAccount = async () => {
    if (!window.confirm('Delete your account? This cannot be undone.')) return;
    try {
      await api(`/users/${me.id}`, { method: 'DELETE' });
      onDelete();
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    }
  };

  const resolvedAvatar = avatarPreview
    ? (avatarPreview.startsWith('blob:') ? avatarPreview : getAvatarUrl(avatarPreview))
    : null;

  return (
    <div style={{ padding: '24px 16px', maxWidth: 560, margin: '0 auto' }} className="fu">
      <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 800, marginBottom: 4 }}>Your Profile</h2>
      <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 28 }}>Update your name, bio, and profile picture.</p>

      <Alert type={status.type} msg={status.msg} />

      <div style={{ ...S.card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }}
          onClick={() => avatarInputRef.current?.click()}
          title="Click to change avatar"
        >
          {resolvedAvatar ? (
            <img
              src={resolvedAvatar}
              alt="Avatar"
              style={{
                width: 80, height: 80, borderRadius: 80 * 0.27,
                objectFit: 'cover',
                border: '2px solid var(--a2)',
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: 80 * 0.27,
              background: 'var(--ag)', border: '2px solid var(--a2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 28, color: 'var(--a)',
            }}>
              {initials(me?.name)}
            </div>
          )}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 80 * 0.27,
            background: 'rgba(0,0,0,0.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: avatarUploading ? 1 : 0,
            transition: 'opacity .15s',
          }}
            onMouseEnter={e => { if (!avatarUploading) e.currentTarget.style.opacity = 1; }}
            onMouseLeave={e => { if (!avatarUploading) e.currentTarget.style.opacity = 0; }}
          >
            {avatarUploading ? <Spinner size={18} color="#fff" /> : <Upload size={16} style={{ color: '#fff' }} />}
          </div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{me?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>{me?.email}</div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            style={{ ...S.btnGhost, fontSize: 10, padding: '6px 12px' }}
          >
            {avatarUploading ? <><Spinner size={10} /> Uploading…</> : <><Upload size={11} /> Change Photo</>}
          </button>
        </div>

        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </div>

      <form onSubmit={handleSave} style={{ ...S.card, marginBottom: 20 }}>
        <Field
          label="Name"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          required
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          required
        />
        <Field
          label="Phone"
          value={form.phone}
          onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
          placeholder="+1 555 000 0000"
        />
        <Field
          label="Bio"
          multiline
          value={form.bio}
          onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
          placeholder="Tell people a little about yourself…"
        />
        <button type="submit" disabled={loading} style={S.btnPrimary}>
          {loading ? <Spinner size={12} color="#000" /> : <><Save size={12} /> Save Changes</>}
        </button>
      </form>

      <div style={{ ...S.card, borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.02)' }}>
        <h4 style={{ color: 'var(--red)', fontFamily: 'var(--fd)', fontWeight: 700, marginBottom: 4 }}>Danger Zone</h4>
        <p style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 16 }}>Permanently deletes your account and all associated data.</p>
        <button type="button" onClick={terminateAccount} style={S.btnDanger}>
          <Trash2 size={12} /> Delete Account
        </button>
      </div>
    </div>
  );
}