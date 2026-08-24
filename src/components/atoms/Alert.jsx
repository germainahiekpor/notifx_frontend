import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Alert({ type = 'error', msg }) {
  if (!msg) return null;
  const cfg = {
    error: { bg: 'var(--rg)', border: 'rgba(248,113,113,.25)', color: 'var(--red)', Icon: AlertCircle },
    success: { bg: 'var(--gg)', border: 'rgba(74,222,128,.25)', color: 'var(--green)', Icon: CheckCircle2 },
  }[type];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: cfg.color }}>
      <cfg.Icon size={14} style={{ flexShrink: 0, marginTop: 1 }} />
      {msg}
    </div>
  );
}