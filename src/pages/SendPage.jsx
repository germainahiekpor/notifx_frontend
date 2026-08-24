import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Send, Upload, X, CheckSquare, Square } from 'lucide-react';
import Spinner from '../components/atoms/Spinner';
import { S } from '../utils';
import Alert from '../components/atoms/Alert';
import Field from '../components/atoms/Field';

export default function SendPage({ api, me, onSent }) {
  const [form, setForm] = useState({ item_name: '', description: '', timestamp: '' });
  const [recipients, setRecipients] = useState([]);
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    let mounted = true;
    setLoadingFriends(true);
    api('/friends', { method: 'GET' })
      .then(res => {
        if (!mounted) return;
        const accepted = (res || []).filter(f => f.status === 'accepted');
        setFriends(accepted);
      })
      .catch(e => setErr('Failed to load friends: ' + (e.message || 'unknown error')))
      .finally(() => mounted && setLoadingFriends(false));
    return () => { mounted = false; };
  }, [api]);

  const filteredFriends = useMemo(() => {
    if (!search.trim()) return friends;
    const q = search.toLowerCase();
    return friends.filter(f => f.name?.toLowerCase().includes(q) || f.email?.toLowerCase().includes(q));
  }, [friends, search]);

  const allFilteredSelected = filteredFriends.length > 0 && filteredFriends.every(f => recipients.includes(f.id));

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api('/notifications/upload', { method: 'POST', body: fd, multipart: true });
      setMedia(prev => [...prev, { url: res.url, media_type: res.media_type }]);
    } catch (e) {
      setErr('Failed to process file: ' + e.message);
    } finally {
      setUploading(false);
    }
  };

  const executeDispatch = async (e) => {
    e.preventDefault();
    if (recipients.length === 0) return setErr('Select at least 1 friend');
    setLoading(true);
    setErr('');

    try {
      const payload = {
        recipient_ids: recipients,
        item_name: form.item_name,
        description: form.description,
        media
      };
      if (form.timestamp) payload.timestamp = new Date(form.timestamp).toISOString();

      await api('/notifications', { method: 'POST', body: payload });
      setForm({ item_name: '', description: '', timestamp: '' });
      setRecipients([]);
      setMedia([]);
      setSearch('');
      onSent();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecipient = (id) => setRecipients(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleSelectAll = () => {
    if (allFilteredSelected) setRecipients(prev => prev.filter(id => !filteredFriends.some(f => f.id === id)));
    else setRecipients(prev => [...new Set([...prev, ...filteredFriends.map(f => f.id)])]);
  };

  return (
    <div className="send-wrap fu">
      <div className="send-title">
        <h2>Send notification/message</h2>
        <p>To multiple users</p>
      </div>

      <Alert type="error" msg={err} />

      <form onSubmit={executeDispatch}>
        <div className="send-section">
          <div className="send-section-head">
            <label style={S.label}>Select Friends *</label>
            {!loadingFriends && friends.length > 0 && (
              <button type="button" onClick={toggleSelectAll} style={S.btnGhost}>
                {allFilteredSelected ? <Square size={12} /> : <CheckSquare size={12} />}
                {allFilteredSelected ? 'Clear' : 'Select All'}
              </button>
            )}
          </div>

          <div className="send-search">
            <input type="text" placeholder="Search friends by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loadingFriends ? (
            <div className="send-loading"><Spinner size={16} /> Loading friends...</div>
          ) : filteredFriends.length === 0 ? (
            <div className="send-empty">{friends.length === 0 ? 'No friends yet. Accept requests first.' : 'No friends match search.'}</div>
          ) : (
            <div className="send-list">
              {filteredFriends.map(f => (
                <label key={f.id} className="send-item">
                  <input type="checkbox" checked={recipients.includes(f.id)} onChange={() => toggleRecipient(f.id)} />
                  <span>{f.name} ({f.email})</span>
                </label>
              ))}
            </div>
          )}
          <div className="send-count">{recipients.length} selected • {filteredFriends.length} shown</div>
        </div>

        <Field label="Title *" value={form.item_name} onChange={e => setForm(p => ({ ...p, item_name: e.target.value }))} placeholder="Subject" required />
        <Field label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Detail description" multiline />

        <div className="send-upload-wrap">
          <label style={S.label}>Upload Media</label>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} style={S.btnGhost} className="send-upload-btn">
            {uploading ? <Spinner size={12} /> : <><Upload size={12} /> Upload File</>}
          </button>

          {media.length > 0 && (
            <div className="send-media-list">
              {media.map((m, idx) => (
                <div key={idx} className="send-media-item">
                  <span>{m.media_type}: {m.url.split('/').pop()}</span>
                  <X size={12} onClick={() => setMedia(prev => prev.filter((_, i) => i !== idx))} />
                </div>
              ))}
            </div>
          )}
        </div>

        <button type="submit" disabled={loading || loadingFriends} style={S.btnPrimary}>
          {loading ? <Spinner size={12} color="#000" /> : <><Send size={12} /> Send</>}
        </button>
      </form>
    </div>
  );
}