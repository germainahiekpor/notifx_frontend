import React from 'react';
import { Bell, Send, Users, User, UserPlus, Layers, LogOut } from 'lucide-react';
import Avatar from '../atoms/Avatar';

export default function Sidebar({ page, setPage, me, onLogout }) {
  const menu = [
    { id: 'notifications', label: 'Inbox', Icon: Bell },
    { id: 'send', label: 'Send notifs', Icon: Send },
    { id: 'users', label: 'User', Icon: Users },
    { id: 'friends', label: 'Friends', Icon: UserPlus },
    { id: "groups", label: "Groups", Icon: Layers },
    { id: 'profile', label: 'Profile', Icon: User },
  ];

  return (
    <div style={{ width: 230, height: '100%', background: 'var(--s1)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--fd)', fontSize: 18, fontWeight: 800, color: 'var(--a)' }}>NOTIFX</div>
      </div>
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {menu.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setPage(id)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 20px', background: page === id ? 'var(--ag)' : 'none', border: 'none', borderLeft: `3px solid ${page === id ? 'var(--a)' : 'transparent'}`, color: page === id ? 'var(--a)' : 'var(--muted)', textAlign: 'left', cursor: 'pointer', textTransform: 'uppercase', fontSize: 11 }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </nav>
      {me && (
        <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Avatar name={me.name} size={32} src={me.avatar_url} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.name}</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <LogOut size={12} /> Log Out
          </button>
        </div>
      )}
    </div>
  );
}