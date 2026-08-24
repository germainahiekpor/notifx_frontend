import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, X } from 'lucide-react';
// import { WS_BASE } from '../constants';
import { BASE, WS_BASE } from '../constants';
import { S, initials, threeSentences } from '../utils';
import { useGlobalCSS } from '../styles/global';
import Spinner from '../components/atoms/Spinner';
import AuthScreen from './AuthScreen';

export default function LandingPage({ onAuth }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [wsStatus, setWsStatus] = useState('connecting');

  useEffect(() => {
    let ws;
    let backoff = 1000;
    let dead = false;
    let reconnectTimer;

    const connect = () => {
      setWsStatus('connecting');
      ws = new WebSocket(`${WS_BASE}/ws/public`);

      ws.onopen = () => {
        backoff = 1000;
        setWsStatus('live');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'users_list') {
            setUsers(msg.data || []);
            setLoadingUsers(false);
          }
        } catch (e) { console.error(e); }
      };

      ws.onclose = () => {
        if (dead) return;
        setWsStatus('reconnecting');
        reconnectTimer = setTimeout(() => {
          backoff = Math.min(backoff * 2, 30000);
          connect();
        }, backoff);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      dead = true;
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .landing-page { min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; }

        /* ── Top nav ── */
        .landing-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px; border-bottom: 1px solid var(--border);
          background: var(--s1); position: sticky; top: 0; z-index: 50;
        }
        .landing-nav-logo { display: flex; align-items: center; gap: 2px; }
        .landing-nav-logo span:first-child { font-family: var(--fd); font-size: 20px; font-weight: 800; color: var(--a); }
        .landing-nav-logo span:last-child  { font-family: var(--fd); font-size: 20px; color: var(--text); }
        .landing-nav-right { display: flex; align-items: center; gap: 10px; }
        .ws-badge {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 10px; text-transform: uppercase; letter-spacing: .06em;
          border-radius: 6px; padding: 3px 9px; border: 1px solid;
          white-space: nowrap;
        }
        .ws-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }

        /* ── Hero ── */
        .landing-hero {
          padding: 48px 24px 36px; text-align: center;
          border-bottom: 1px solid var(--border);
        }
        .landing-hero h1 {
          font-family: var(--fd); font-weight: 800;
          font-size: clamp(26px, 5vw, 40px);
          letter-spacing: -0.02em; margin-bottom: 10px;
        }
        .landing-hero p { color: var(--muted); font-size: 13px; max-width: 380px; margin: 0 auto 24px; line-height: 1.6; }
        .member-badge {
          display: inline-block;
          background: var(--ag); border: 1px solid var(--a2);
          border-radius: 20px; padding: 5px 16px;
          font-size: 12px; color: var(--a); font-weight: 700;
        }

        /* ── Search ── */
        .landing-main { flex: 1; padding: 28px 20px; max-width: 1200px; margin: 0 auto; width: 100%; }
        .landing-search { position: relative; margin-bottom: 28px; }
        .landing-search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--muted); pointer-events: none; }
        .landing-search input { width: 100%; background: var(--s2); border: 1px solid var(--border); border-radius: 10px; padding: 11px 14px 11px 38px; color: var(--text); font-size: 13px; font-family: var(--fm); outline: none; transition: border-color .15s; }
        .landing-search input:focus { border-color: var(--a); }

        /* ── Grid ── */
        .landing-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }
        @media (max-width: 1100px) { .landing-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 780px)  { .landing-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; } }
        @media (max-width: 480px)  { .landing-grid { grid-template-columns: 1fr; gap: 12px; } }

        /* ── Card ── */
        .user-card {
          background: var(--s1);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color .18s, box-shadow .18s, transform .18s;
          animation: fadeUp .3s ease both;
        }
        .user-card:hover {
          border-color: var(--a2);
          box-shadow: 0 6px 32px var(--ag);
          transform: translateY(-3px);
        }

        /* ── Card cover ── */
        .card-cover {
          width: 100%; height: 130px;
          position: relative; overflow: hidden;
          flex-shrink: 0;
        }
        .card-cover img {
          width: 100%; height: 100%;
          object-fit: cover; display: block;
        }
        .card-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--fd); font-weight: 800;
          font-size: 52px; color: var(--a2);
          letter-spacing: -3px; user-select: none;
        }
        /* Per-user gradient so cards look distinct */
        .card-cover-g0 { background: linear-gradient(135deg, #fff7e6 0%, #ffe0b2 100%); }
        .card-cover-g1 { background: linear-gradient(135deg, #e3f2fd 0%, #b3e5fc 100%); }
        .card-cover-g2 { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); }
        .card-cover-g3 { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); }
        .card-cover-g4 { background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%); }
        .card-cover-g5 { background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%); }

        /* ── Card body ── */
        .card-body {
          padding: 0 16px 18px;
          display: flex; flex-direction: column; flex: 1;
        }
        .card-avatar-row {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-top: -32px; margin-bottom: 12px;
        }
        .card-avatar-img {
          width: 64px; height: 64px;
          border-radius: 16px;
          border: 3px solid var(--s1);
          object-fit: cover; flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,.10);
        }
        .card-avatar-initials {
          width: 64px; height: 64px;
          border-radius: 16px;
          border: 3px solid var(--s1);
          background: var(--ag);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--fd); font-weight: 800; font-size: 22px;
          color: var(--a); flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(0,0,0,.08);
        }
        .card-uid {
          font-size: 10px; color: var(--muted);
          background: var(--s2); border: 1px solid var(--border);
          border-radius: 4px; padding: 2px 8px;
        }
        .card-name {
          font-family: var(--fd); font-weight: 800;
          font-size: 15px; color: var(--text);
          margin-bottom: 3px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .card-email {
          font-size: 11px; color: var(--muted);
          margin-bottom: 10px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* ── Bio ── */
        .card-bio {
          font-size: 12px; color: var(--muted);
          line-height: 1.65; margin-bottom: 16px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .card-bio-empty {
          font-size: 12px; color: var(--border2);
          line-height: 1.65; margin-bottom: 16px;
          font-style: italic; flex: 1;
        }

        /* ── Auth modal ── */
        .auth-modal-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,.55);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          animation: fadeUp .2s ease both;
        }
        .auth-modal-inner { position: relative; width: 100%; max-width: 400px; }
        .auth-modal-close {
          position: absolute; top: 12px; right: 12px;
          background: none; border: none; color: var(--muted);
          cursor: pointer; z-index: 10; display: flex; align-items: center;
        }
        .auth-modal-close:hover { color: var(--text); }

        /* ── Empty / Loading states ── */
        .landing-empty {
          text-align: center; padding: 64px 24px;
          color: var(--muted); border: 1px dashed var(--border);
          border-radius: 14px; font-size: 13px;
        }
        .landing-loading {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          padding: 64px 24px; color: var(--muted); font-size: 13px;
        }

        /* ── Mobile nav tweaks ── */
        @media (max-width: 500px) {
          .landing-nav { padding: 12px 16px; }
          .landing-hero { padding: 32px 16px 24px; }
          .landing-main { padding: 20px 14px; }
          .ws-badge-label { display: none; }
        }
      `}</style>

      <div className="landing-page">

        <header className="landing-nav">
          <div className="landing-nav-logo">
            <span>NOTIFX</span><span></span>
          </div>
          <div className="landing-nav-right">
            <span
              className="ws-badge"
              style={{
                color: wsStatus === 'live' ? 'var(--green)' : wsStatus === 'reconnecting' ? 'var(--a)' : 'var(--muted)',
                background: wsStatus === 'live' ? 'var(--gg)' : wsStatus === 'reconnecting' ? 'var(--ag)' : 'var(--s2)',
                borderColor: wsStatus === 'live' ? 'rgba(74,222,128,.3)' : wsStatus === 'reconnecting' ? 'var(--a2)' : 'var(--border)',
              }}
            >
              <span
                className="ws-dot"
                style={{
                  background: wsStatus === 'live' ? 'var(--green)' : wsStatus === 'reconnecting' ? 'var(--a)' : 'var(--muted)',
                  animation: wsStatus !== 'live' ? 'spin 1.2s linear infinite' : 'none',
                }}
              />
              <span className="ws-badge-label">
                {wsStatus === 'live' ? 'Live' : wsStatus === 'reconnecting' ? 'Reconnecting' : 'Connecting'}
              </span>
            </span>

            <button onClick={() => setShowAuth(true)} style={{ ...S.btnPrimary, padding: '9px 16px' }}>
              <User size={13} /> Sign In
            </button>
          </div>
        </header>

        <div className="landing-hero">
          <h1>The <span style={{ color: 'var(--a)' }}>Notifx users</span></h1>
          <p>Browse registered members. Sign in to send notifications and connect.</p>
          <span className="member-badge">
            {users.length} member{users.length !== 1 ? 's' : ''} registered
          </span>
        </div>

        <main className="landing-main">

          <div className="landing-search">
            <Search size={14} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email…"
            />
          </div>

          {loadingUsers ? (
            <div className="landing-loading">
              <Spinner size={22} /> Loading members…
            </div>
          ) : filtered.length === 0 ? (
            <div className="landing-empty">
              {searchQuery ? `No members matching "${searchQuery}"` : 'No members yet. Be the first to register!'}
            </div>
          ) : (
            <div className="landing-grid">
              {filtered.map((u, idx) => {
                const avatarSrc = u.avatar_url
                  ? (u.avatar_url.startsWith('http') ? u.avatar_url : `${BASE}${u.avatar_url.startsWith('/') ? '' : '/'}${u.avatar_url}`)
                  : null;
                const gradClass = `card-cover-g${u.id % 6}`;
                const bioText = threeSentences(u.bio);

                return (
                  <div key={u.id} className="user-card" style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}>

                    <div className={`card-cover ${!avatarSrc ? gradClass : ''}`}>
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={u.name}
                          onError={e => {
                            e.target.style.display = 'none';
                            e.target.parentNode.classList.add(gradClass);
                            const placeholder = e.target.parentNode.querySelector('.card-cover-placeholder');
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className="card-cover-placeholder"
                        style={{ display: avatarSrc ? 'none' : 'flex' }}
                      >
                        {initials(u.name)}
                      </div>
                    </div>

                    <div className="card-body">


                      <div className="card-name" title={u.name}>{u.name}</div>
                  
                      {bioText ? (
                        <p className="card-bio">{bioText}</p>
                      ) : (
                        <p className="card-bio-empty">No bio yet.</p>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {showAuth && (
        <div className="auth-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false); }}>
          <div className="auth-modal-inner">
            <button className="auth-modal-close" onClick={() => setShowAuth(false)} title="Close">
              <X size={18} />
            </button>
            <AuthScreen onAuth={onAuth} />
          </div>
        </div>
      )}
    </>
  );
}