import React from 'react';
import { BASE } from '../../constants';
import { initials } from '../../utils';

export default function Avatar({ name, size = 32, fontSize = 14, src }) {
  if (src) {
    const resolved = src.startsWith('http') || src.startsWith('blob:') ? src : `${BASE}${src.startsWith('/') ? '' : '/'}${src}`;
    return (
      <img
        src={resolved}
        alt={initials(name)}
        style={{ width: size, height: size, borderRadius: size * 0.27, objectFit: 'cover', border: '1px solid var(--a2)', flexShrink: 0 }}
        onError={e => { e.target.style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.27, background: 'var(--ag)', border: '1px solid var(--a2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--fd)', fontWeight: 700, fontSize, color: 'var(--a)', flexShrink: 0 }}>
      {initials(name)}
    </div>
  );
}