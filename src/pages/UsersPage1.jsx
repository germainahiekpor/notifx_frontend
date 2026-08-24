import React from 'react';
import { S } from '../utils';
import Avatar from '../components/atoms/Avatar';

export default function UsersPage({ users }) {
  return (
    <div style={{ padding: '24px 16px', maxWidth: 800, margin: '0 auto' }} className="fu">
      <h2 style={{ fontFamily: 'var(--fd)', fontWeight: 800, marginBottom: 4 }}>Available users</h2>
      <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 24 }}>Search for user you will like to connect with.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {users.map(u => (
          <div key={u.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={u.name} size={40} fontSize={16} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}