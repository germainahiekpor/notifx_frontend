import React, { useState, useMemo } from 'react';
import { Search, Mail, MessageCircle } from 'lucide-react';
import { BASE } from '../constants';
import { S, initials, threeSentences } from '../utils';
import Avatar from '../components/atoms/Avatar';

export default function UsersPage({ users, onContact }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.bio?.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  return (
    <>
      <style>{`
        /* ── Layout ── */
        .users-page { padding: 28px 20px; max-width: 1200px; margin: 0 auto; }

        /* ── Header ── */
        .users-header { margin-bottom: 24px; }
        .users-header h2 {
          font-family: var(--fd); font-weight: 800; font-size: 22px;
          color: var(--text); margin-bottom: 4px;
        }
        .users-header p { color: var(--muted); font-size: 12px; }

        /* ── Search ── */
        .users-search { position: relative; margin-bottom: 24px; }
        .users-search svg {
          position: absolute; left: 13px; top: 50%;
          transform: translateY(-50%); color: var(--muted); pointer-events: none;
        }
        .users-search input {
          width: 100%; background: var(--s2); border: 1px solid var(--border);
          border-radius: 10px; padding: 11px 14px 11px 38px;
          color: var(--text); font-size: 13px; font-family: var(--fm);
          outline: none; transition: border-color .15s; box-sizing: border-box;
        }
        .users-search input:focus { border-color: var(--a); }

        /* ── Grid ── */
        .users-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1100px) { .users-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 780px)  { .users-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
        @media (max-width: 480px)  { .users-grid { grid-template-columns: 1fr; gap: 10px; } }

        /* ── Card ── */
        .ucard {
          background: var(--s1);
          border: 1px solid var(--border);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color .18s, box-shadow .18s, transform .18s;
          animation: fadeUp .3s ease both;
        }
        .ucard:hover {
          border-color: var(--a2);
          box-shadow: 0 6px 28px var(--ag);
          transform: translateY(-3px);
        }

        /* ── Cover ── */
        .ucard-cover {
          width: 100%; height: 90px;
          position: relative; overflow: hidden; flex-shrink: 0;
        }
        .ucard-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ucard-cover-placeholder {
          width: 100%; height: 100%;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--fd); font-weight: 800;
          font-size: 40px; color: var(--a2);
          letter-spacing: -3px; user-select: none;
        }
        .ucard-cg0 { background: linear-gradient(135deg, #fff7e6 0%, #ffe0b2 100%); }
        .ucard-cg1 { background: linear-gradient(135deg, #e3f2fd 0%, #b3e5fc 100%); }
        .ucard-cg2 { background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); }
        .ucard-cg3 { background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); }
        .ucard-cg4 { background: linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%); }
        .ucard-cg5 { background: linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 100%); }

        /* ── Body ── */
        .ucard-body { padding: 0 14px 16px; display: flex; flex-direction: column; flex: 1; }

        .ucard-avatar-row {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-top: -28px; margin-bottom: 10px;
        }
        .ucard-avatar-img {
          width: 56px; height: 56px; border-radius: 14px;
          border: 3px solid var(--s1); object-fit: cover;
          box-shadow: 0 2px 10px rgba(0,0,0,.10);
        }
        .ucard-avatar-initials {
          width: 56px; height: 56px; border-radius: 14px;
          border: 3px solid var(--s1);
          background: var(--ag);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--fd); font-weight: 800; font-size: 20px;
          color: var(--a);
          box-shadow: 0 2px 10px rgba(0,0,0,.08);
        }

        .ucard-name {
          font-family: var(--fd); font-weight: 800; font-size: 14px;
          color: var(--text); margin-bottom: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ucard-email {
          font-size: 11px; color: var(--muted); margin-bottom: 10px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          display: flex; align-items: center; gap: 4px;
        }
        .ucard-bio {
          font-size: 11.5px; color: var(--muted); line-height: 1.65;
          margin-bottom: 14px; flex: 1;
          display: -webkit-box; -webkit-line-clamp: 3;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .ucard-bio-empty {
          font-size: 11.5px; color: var(--border2);
          font-style: italic; line-height: 1.65;
          margin-bottom: 14px; flex: 1;
        }

        /* ── Contact button ── */
        .ucard-contact {
          display: flex; align-items: center; justify-content: center; gap: 6px;
          width: 100%; padding: 8px 12px;
          background: var(--ag); border: 1px solid var(--a2);
          border-radius: 10px; color: var(--a);
          font-size: 12px; font-weight: 700; font-family: var(--fm);
          cursor: pointer; transition: background .15s, border-color .15s;
        }
        .ucard-contact:hover { background: var(--a); border-color: var(--a); color: #fff; }

        /* ── Empty ── */
        .users-empty {
          text-align: center; padding: 64px 24px;
          color: var(--muted); border: 1px dashed var(--border);
          border-radius: 14px; font-size: 13px;
        }
      `}</style>

      <div className="users-page fu">
        <div className="users-header">
          <h2>Available users</h2>
          <p>Browse members and reach out to connect.</p>
        </div>

        <div className="users-search">
          <Search size={14} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or bio…"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="users-empty">
            {searchQuery ? `No users matching "${searchQuery}"` : 'No users yet.'}
          </div>
        ) : (
          <div className="users-grid">
            {filtered.map((u, idx) => {
              const avatarSrc = u.avatar_url
                ? (u.avatar_url.startsWith('http') ? u.avatar_url : `${BASE}${u.avatar_url.startsWith('/') ? '' : '/'}${u.avatar_url}`)
                : null;
              const gradClass = `ucard-cg${u.id % 6}`;
              const bioText = threeSentences(u.bio);

              return (
                <div
                  key={u.id}
                  className="ucard"
                  style={{ animationDelay: `${Math.min(idx, 12) * 40}ms` }}
                >
                  {/* Cover */}
                  <div className={`ucard-cover ${!avatarSrc ? gradClass : ''}`}>
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={u.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.classList.add(gradClass);
                          const ph = e.target.parentNode.querySelector('.ucard-cover-placeholder');
                          if (ph) ph.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="ucard-cover-placeholder"
                      style={{ display: avatarSrc ? 'none' : 'flex' }}
                    >
                      {initials(u.name)}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="ucard-body">


                    <div className="ucard-name" title={u.name}>{u.name}</div>

                    <div className="ucard-email">
                      <Mail size={10} style={{ flexShrink: 0 }} />
                      <span title={u.email}>{u.email}</span>
                    </div>

                    {bioText ? (
                      <p className="ucard-bio">{bioText}</p>
                    ) : (
                      <p className="ucard-bio-empty">No bio yet.</p>
                    )}

 
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
