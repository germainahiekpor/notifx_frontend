import React, { useState } from 'react';
import { S } from '../../utils';

export default function Field({ label, type = 'text', value, onChange, placeholder, multiline, required }) {
  const [focused, setFocused] = useState(false);
  const base = { ...S.input, borderColor: focused ? 'var(--a)' : 'var(--border)', transition: 'border-color.15s' };
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={S.label}>{label}{required && <span style={{ color: 'var(--a)', marginLeft: 3 }}>*</span>}</label>
      {multiline
        ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3} style={{ ...base, resize: 'vertical' }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      }
    </div>
  );
}