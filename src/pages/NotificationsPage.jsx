import React, { useState, useCallback, useMemo } from 'react';
import { Package, Clock, RefreshCw, Trash2, Film } from 'lucide-react';
import { S, fmt } from '../utils';
import { BASE } from '../constants';
import Spinner from '../components/atoms/Spinner';

export default function NotificationsPage({ notifications, me, users, onRefresh, api }) {
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [deletingId, setDeletingId] = useState(null);

  const sync = async () => {
    setLoading(true);
    await onRefresh();
    setLoading(false);
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteNotif = async (n) => {
    const isSender = n.sender_id === me?.id;
    const flag = isSender ? 'deleted_by_sender' : 'deleted_by_receiver';

    const confirmMsg = isSender
      ? 'Delete this notification for both you and the receiver?'
      : 'Delete this notification from your inbox only?';

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(n.id);
    try {
      await api(`/notifications/${n.id}?soft=true&flag=${flag}`, {
        method: 'DELETE',
        body: { soft: true, flag }
      });
      await onRefresh();
    } catch (e) {
      alert('Delete failed: ' + e.message);
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  const getSenderName = (id) => users.find(u => u.id === id)?.name || `Entity #${id}`;

  const inbound = notifications.filter(n => n.user_id === me?.id);
  const outbound = notifications.filter(n => n.sender_id === me?.id);
  const stream = filter === 'all' ? notifications : filter === 'inbound' ? inbound : outbound;

  return (
    <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }} className="fu">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 800 }}>Notification</h2>
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>Messages queues</p>
        </div>
        <button onClick={sync} disabled={loading} style={S.btnGhost}>
          <RefreshCw size={12} className={loading ? 'spin' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={S.card}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{notifications.length}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>All</div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--c)' }}>{inbound.length}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Inbound Records</div>
        </div>
        <div style={S.card}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--a)' }}>{outbound.length}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>Outbound Records</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'inbound', 'outbound'].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ ...S.btnGhost, background: filter === t ? 'var(--s3)' : 'var(--s1)', borderColor: filter === t ? 'var(--a)' : 'var(--border)' }}>
            {t}
          </button>
        ))}
      </div>

      {stream.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', color: 'var(--muted)', padding: 48 }}>No historical event rows matching the selected pipeline filter parameters.</div>
      ) : (
        stream.map(n => {
          const isInbound = n.user_id === me?.id;
          const isSender = n.sender_id === me?.id;
          const isExpanded = expandedIds.has(n.id);
          const hasLongDesc = n.description && n.description.length > 120;

          return (
            <div key={n.id} style={{ ...S.card, marginBottom: 12, position: 'relative' }}>
              <button
                onClick={() => deleteNotif(n)}
                disabled={deletingId === n.id}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'var(--rg)',
                  border: '1px solid rgba(248,113,113,.25)',
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: 'var(--red)',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10,
                  textTransform: 'uppercase'
                }}
                title={isSender ? 'Delete for both users' : 'Delete from your inbox only'}
              >
                {deletingId === n.id ? <Spinner size={10} /> : <><Trash2 size={12} /> Delete</>}
              </button>

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, paddingRight: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={14} style={{ color: isInbound ? 'var(--c)' : 'var(--a)' }} />
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{n.item_name}</span>
                </div>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: isInbound ? 'var(--cg)' : 'var(--ag)', color: isInbound ? 'var(--c)' : 'var(--a)' }}>
                  {isInbound ? 'INBOUND' : 'OUTBOUND'}
                </span>
              </div>

              {n.description && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{
                    color: 'var(--text)',
                    fontSize: 12,
                    lineHeight: 1.5,
                    margin: 0,
                    display: isExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'none' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    wordBreak: 'break-word'
                  }}>
                    {n.description}
                  </p>
                  {hasLongDesc && (
                    <button
                      onClick={() => toggleExpand(n.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--a)',
                        fontSize: 11,
                        cursor: 'pointer',
                        padding: '4px 0 0 0',
                        textTransform: 'uppercase',
                        fontWeight: 600
                      }}
                    >
                      {isExpanded ? 'Less' : 'More'}
                    </button>
                  )}
                </div>
              )}

              {!n.description && (
                <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12 }}>No supplemental descriptions attached.</p>
              )}

              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 8, flexWrap: 'wrap' }}>
                <span>Source: <strong style={{ color: 'var(--text)' }}>{getSenderName(n.sender_id)}</strong></span>
                <span>Destination: <strong style={{ color: 'var(--text)' }}>{getSenderName(n.user_id)}</strong></span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {fmt(n.timestamp)}</span>
              </div>

              {n.media && n.media.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {n.media.map((m) => (
                    <a key={m.id} href={`${BASE}${m.url}`} target="_blank" rel="noreferrer" style={{ position: 'relative', display: 'block' }}>
                      {m.media_type === 'image' ? (
                        <img src={`${BASE}${m.url}`} alt="Attached Asset File" style={{ width: 80, height: 60, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border)' }} />
                      ) : (
                        <div style={{ width: 80, height: 60, background: 'var(--s3)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                          <Film size={16} style={{ color: 'var(--c)' }} />
                        </div>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}