import { BASE } from '../constants';

export const parseJWT = (t) => {
  try { return JSON.parse(atob(t.split('.')[1])); }
  catch { return {}; }
};

export const fmt = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
};

export const initials = (n = '') =>
  n.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export const threeSentences = (bio = '') => {
  if (!bio) return '';
  const sentences = bio.match(/[^.!?]+[.!?]+/g) || [bio];
  return sentences.slice(0, 5).join(' ').trim();
};

export const makeApi = (token) => async (path, { method = 'GET', body, multipart = false } = {}) => {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body && !multipart) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: multipart ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) throw new Error(data.error || `HTTP error ${res.status}`);
  return data;
};

// Style schemas (shared across components)
export const S = {
  card: { background: 'var(--s1)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 22px' },
  label: { display: 'block', fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 7 },
  input: { width: '100%', background: 'var(--s2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', color: 'var(--text)', fontSize: 13, outline: 'none' },
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: 'var(--a)', color: '#000', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer' },
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'var(--s2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer' },
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'var(--rg)', color: 'var(--red)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 8, fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', cursor: 'pointer' }
};