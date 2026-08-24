import React from 'react';

export default function Spinner({ size = 16, color = 'var(--a)' }) {
  return (
    <span style={{ display: 'inline-block', width: size, height: size, border: '2px solid var(--border2)', borderTopColor: color, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  );
}