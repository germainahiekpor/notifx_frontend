import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Bell, Send, Users, User, LogOut, Package, Clock, X, RefreshCw,
  Upload, Check, Film, ArrowUpRight, Inbox, Edit3, Save, Trash2,
  Image as Img, Plus, AlertCircle, CheckCircle2, Menu, Layers, MessageSquare
} from "lucide-react";
import {  useMemo } from "react";
import {Search, CheckSquare, Square } from "lucide-react";

import { WS_BASE } from '../constants';
import { S } from '../utils';
import Avatar from '../components/atoms/Avatar';
import Spinner from '../components/atoms/Spinner';

/* ─── GROUP CHAT PAGE ─────────────────────────────────────────────────────── */
export default function GroupChatPage({ api, me, groupId, token, onBack }) {
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composeText, setComposeText] = useState("");
  const [composeMedia, setComposeMedia] = useState([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [composeError, setComposeError] = useState("");

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const wsRef = useRef(null);

  const getMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const addMessage = useCallback((msg) => {
    setMessages(prev => {
      if (prev.some(m => String(m.id) === String(msg.id))) return prev;
      return [...prev, msg].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });
  }, []);

  // Load group info + message history
  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    setError("");
    Promise.all([
      api("/groups"),
      api(`/groups/${groupId.id}/messages`),
    ])
      .then(([groups, msgs]) => {
        const g = (groups || []).find(x => x.id === groupId.id);
        setGroup(g || groupId);
        setMessages(Array.isArray(msgs) ? msgs : []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [groupId, api]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket — listen for group_message events on this group
  useEffect(() => {
    if (!token || !groupId) return;

    const connect = () => {
      const ws = new WebSocket(`${WS_BASE}/ws?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "group_message" && String(msg.group_id) === String(groupId.id)) {
            addMessage(msg.message);
          }
        } catch {}
      };

      ws.onclose = () => {
        wsRef.current = null;
        // Reconnect unless component is unmounting
        setTimeout(() => {
          if (wsRef.current === null) connect();
        }, 2000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      const ws = wsRef.current;
      wsRef.current = null; // signal unmounting — skip reconnect
      ws?.close();
    };
  }, [token, groupId, addMessage]);

  // File upload
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api("/notifications/upload", { method: "POST", body: fd, multipart: true });
      setComposeMedia(prev => [...prev, { url: res.url, media_type: res.media_type }]);
    } catch (err) {
      setComposeError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!composeText.trim() && composeMedia.length === 0) return;
    setSending(true);
    setComposeError("");
    try {
      const msg = await api(`/groups/${groupId.id}/messages`, {
        method: "POST",
        body: { content: composeText.trim(), media: composeMedia.length ? composeMedia : undefined },
      });
      // Server also broadcasts via WS — but add optimistically in case WS is slow
      addMessage({ ...msg, sender_name: me?.name, sender_avatar: me?.avatar_url });
      setComposeText("");
      setComposeMedia([]);
      inputRef.current?.focus();
    } catch (err) {
      setComposeError("Send failed: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Loading / error guards ────────────────────────────────────────────────
  if (loading) {
    return <div style={{ padding: 48, textAlign: "center" }}><Spinner size={24} /></div>;
  }
  if (error) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Alert type="error" msg={error} />
        <button onClick={onBack} style={{ ...S.btnGhost, marginTop: 16 }}>
          <ArrowUpRight size={12} style={{ transform: "rotate(180deg)" }} /> Back
        </button>
      </div>
    );
  }

  const displayGroup = group || groupId;
  const members = displayGroup?.members || [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxWidth: 760, margin: "0 auto", padding: "0 16px" }} className="fu">

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <button onClick={onBack} style={S.btnGhost}>
          <ArrowUpRight size={12} style={{ transform: "rotate(180deg)" }} /> Back
        </button>

        {/* Group avatar stack */}
        <div style={{ display: "flex", position: "relative", width: members.slice(0, 3).length * 20 + 24, height: 36, flexShrink: 0 }}>
          {members.slice(0, 3).map((m, i) => (
            <div key={m.id} style={{ position: "absolute", left: i * 18, zIndex: 3 - i }}>
              <Avatar name={m.name} size={34} fontSize={12} src={m.avatar_url} />
            </div>
          ))}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {displayGroup?.name}
          </div>
          <div style={{ fontSize: 10, color: "var(--muted)" }}>
            {members.length} member{members.length !== 1 ? "s" : ""} · group chat
          </div>
        </div>

        {/* Live indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--green)", background: "var(--gg)", border: "1px solid rgba(74,222,128,.3)", borderRadius: 20, padding: "4px 10px", flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", flexShrink: 0 }} />
          Live
        </div>
      </div>

      {/* ── Message list ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
        {messages.length === 0 ? (
          <div style={{ ...S.card, textAlign: "center", color: "var(--muted)", padding: 48 }}>
            <MessageSquare size={28} style={{ opacity: 0.3, display: "block", margin: "0 auto 12px" }} />
            No messages yet — start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = String(msg.sender_id) === String(me?.id);
            const senderName = msg.sender_name || `User #${msg.sender_id}`;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
              : "";

            return (
              <div key={msg.id} style={{ marginBottom: 10, display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                {/* Sender label for others */}
                {!isMe && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, marginLeft: 4 }}>
                    <Avatar name={senderName} size={20} fontSize={8} src={msg.sender_avatar} />
                    <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{senderName}</span>
                  </div>
                )}

                <div style={{
                  maxWidth: "72%",
                  background: isMe ? "var(--ag)" : "var(--s1)",
                  border: `1px solid ${isMe ? "var(--a2)" : "var(--border)"}`,
                  borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  padding: "10px 14px",
                }}>
                  {msg.content && (
                    <p style={{ fontSize: 13, color: "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                      {msg.content}
                    </p>
                  )}

                  {/* Media attachments */}
                  {msg.media && msg.media.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: msg.content ? 8 : 0, flexWrap: "wrap" }}>
                      {msg.media.map((m, idx) => (
                        <a key={idx} href={getMediaUrl(m.url)} target="_blank" rel="noreferrer">
                          {m.media_type === "image" ? (
                            <img
                              src={getMediaUrl(m.url)}
                              alt=""
                              style={{ width: 100, height: 75, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)" }}
                              onError={e => e.target.style.display = "none"}
                            />
                          ) : (
                            <div style={{ width: 100, height: 75, background: "var(--s3)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                              <Film size={20} style={{ color: "var(--c)" }} />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 6, textAlign: isMe ? "right" : "left" }}>
                    {timeStr}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Compose bar ── */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 0 16px", flexShrink: 0 }}>
        {composeError && <Alert type="error" msg={composeError} />}

        {/* Attached media chips */}
        {composeMedia.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            {composeMedia.map((m, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 11 }}>
                {m.media_type === "image" ? <Img size={11} /> : <Film size={11} />}
                <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.url.split("/").pop()}</span>
                <X size={11} style={{ cursor: "pointer", color: "var(--red)" }} onClick={() => setComposeMedia(prev => prev.filter((_, i) => i !== idx))} />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={composeText}
            onChange={e => setComposeText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message the group… (Enter to send, Shift+Enter for newline)"
            rows={1}
            style={{
              ...S.input,
              flex: 1,
              resize: "none",
              minHeight: 40,
              maxHeight: 120,
              padding: "10px 13px",
              lineHeight: 1.5,
              overflowY: "auto",
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
          />

          {/* Upload button */}
          <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{ ...S.btnGhost, padding: "10px 12px", flexShrink: 0 }}
            title="Attach file"
          >
            {uploading ? <Spinner size={13} /> : <Upload size={13} />}
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || (!composeText.trim() && composeMedia.length === 0)}
            style={{ ...S.btnPrimary, padding: "10px 16px", flexShrink: 0 }}
          >
            {sending ? <Spinner size={13} color="#000" /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}

