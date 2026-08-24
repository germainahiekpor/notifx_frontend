import { useEffect } from 'react';

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Fira+Code:wght@300;400;500&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg: #ffffff;
  --s1: #ffffff;
  --s2: #ffffff;
  --s3: #3d59e2;
  --border: #e5e4e2;
  --border2: #e5e4e2;
  --text: #000208;
  --muted: #474c6b;
  --a: #f5a623;
  --ag: rgba(245, 166, 35,.1);
  --a2: rgba(245, 166, 35,.25);
  --c: #22d3ee;
  --cg: rgba(34, 211, 238,.1);
  --c2: rgba(34, 211, 238,.25);
  --red: #f87171;
  --rg: rgba(248, 113, 113,.1);
  --green: #4ade80;
  --gg: rgba(74, 222, 128,.1);
  --fd: 'Syne', sans-serif;
  --fm: 'Fira Code', monospace;
}
html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--fm); font-size: 13px; -webkit-font-smoothing: antialiased; }
button, input, textarea, select { font-family: var(--fm); }
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--s3); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: var(--a); }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.fu { animation: fadeUp.28s ease both; }

.send-wrap { padding: 24px 16px; max-width: 600px; margin: 0 auto; }
.send-title h2 { font-family: var(--fd); font-weight: 800; margin-bottom: 4px; }
.send-title p { color: var(--muted); font-size: 12px; margin-bottom: 24px; }
.send-section { margin-bottom: 16px; }
.send-section-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.send-search { margin-bottom: 8px; }
.send-search input { width: 100%; background: var(--s2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 13px; color: var(--text); font-size: 13px; }
.send-loading { padding: 24px; text-align: center; color: var(--muted); }
.send-empty { padding: 16px; text-align: center; color: var(--muted); border: 1px dashed var(--border); border-radius: 8px; }
.send-list { max-height: 150px; overflow-y: auto; border: 1px solid var(--border); background: var(--s1); border-radius: 8px; padding: 8px; }
.send-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; cursor: pointer; }
.send-item input { accent-color: var(--a); }
.send-item span { font-size: 12px; }
.send-count { font-size: 11px; color: var(--muted); margin-top: 4px; }
.send-upload-wrap { margin-bottom: 24px; }
.send-upload-btn { width: 100%; border-style: dashed; justify-content: center; }
.send-media-list { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.send-media-item { padding: 4px 8px; background: var(--s2); border-radius: 6px; display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); }
.send-media-item span { font-size: 11px; }
.send-media-item svg { cursor: pointer; color: var(--red); }
`;

export function useGlobalCSS() {
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
}