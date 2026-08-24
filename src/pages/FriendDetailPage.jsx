import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowUpRight, Send, Upload, X, Edit3, Film, Image } from 'lucide-react';
//import { S, fmt, BASE } from '../utils';
// To these two lines:
import { S, fmt } from '../utils';
import { BASE } from '../constants';
import Avatar from '../components/atoms/Avatar';
import Alert from '../components/atoms/Alert';
import Spinner from '../components/atoms/Spinner';

export default function FriendDetailPage({ api, friendId, me, onBack }) {
  const [friend, setFriend] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [composeText, setComposeText] = useState('');
  const [composeTitle, setComposeTitle] = useState('');
  const [composeMedia, setComposeMedia] = useState([]);
  const [composeSending, setComposeSending] = useState(false);
  const [composeUploading, setComposeUploading] = useState(false);
  const [composeError, setComposeError] = useState('');
  const [showTitleInput, setShowTitleInput] = useState(false);

  const bottomRef = useRef(null);
  const composeFileRef = useRef(null);
  const composeInputRef = useRef(null);

  const addNotification = useCallback((newNotif) => {
    setNotifications((prev) => {
      if (prev.some((n) => String(n.id) === String(newNotif.id))) return prev;
      return [...prev, newNotif].sort(
        (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
      );
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const cleanFriendId = String(friendId).trim();
    if (!cleanFriendId || cleanFriendId === 'false') {
      setError('Invalid friend ID');
      setLoading(false);
      return;
    }

    Promise.all([
      api(`/users/${cleanFriendId}`).catch((e) => {
        throw new Error(`User fetch failed: ${e.message}`);
      }),
      api(`/notifications/with/${cleanFriendId}`).catch((e) => {
        if (e.message.includes('204') || e.message.includes('404')) return [];
        throw new Error(`Notifications fetch failed: ${e.message}`);
      }),
    ])
      .then(([friendData, notifData]) => {
        if (cancelled) return;
        setFriend(friendData);
        const rawList = Array.isArray(notifData)
          ? notifData
          : notifData?.data || notifData?.notifications || [];
        setNotifications(
          rawList.sort(
            (a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0)
          )
        );
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('FriendDetail error:', err);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [friendId, api]);

  useEffect(() => {
    const handler = (e) => {
      const notif = e.detail;
      if (!notif) return;
      const isSender = String(notif.sender_id) === String(friendId);
      const isReceiver = String(notif.user_id) === String(friendId);
      if (isSender || isReceiver) addNotification(notif);
    };
    window.addEventListener('new-notification', handler);
    return () => window.removeEventListener('new-notification', handler);
  }, [friendId, addNotification]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notifications]);

  const getMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${BASE}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleReply = async (parentId) => {
    if (!replyText.trim()) return;
    const parent = notifications.find((n) => n.id === parentId);
    try {
      const newNotif = await api('/notifications', {
        method: 'POST',
        body: {
          recipient_ids: [Number(friendId)],
          item_name: `Re: ${parent?.item_name || 'message'}`,
          description: replyText,
          parent_id: parentId,
        },
      });
      const notif = Array.isArray(newNotif) ? newNotif[0] : newNotif;
      if (notif) addNotification(notif);
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      alert('Reply failed: ' + err.message);
    }
  };

  const handleComposeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setComposeUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api('/notifications/upload', {
        method: 'POST',
        body: fd,
        multipart: true,
      });
      setComposeMedia((prev) => [
        ...prev,
        { url: res.url, media_type: res.media_type },
      ]);
    } catch (e) {
      setComposeError('Upload failed: ' + e.message);
    } finally {
      setComposeUploading(false);
      if (composeFileRef.current) composeFileRef.current.value = '';
    }
  };

  const handleComposeSend = async () => {
    const title = composeTitle.trim() || composeText.trim().slice(0, 60) || 'Message';
    if (!composeText.trim() && composeMedia.length === 0) return;

    setComposeSending(true);
    setComposeError('');
    try {
      const newNotif = await api('/notifications', {
        method: 'POST',
        body: {
          recipient_ids: [Number(friendId)],
          item_name: title,
          description: composeText.trim(),
          media: composeMedia,
        },
      });
      const notif = Array.isArray(newNotif) ? newNotif[0] : newNotif;
      if (notif) addNotification(notif);
      setComposeText('');
      setComposeTitle('');
      setComposeMedia([]);
      setShowTitleInput(false);
      composeInputRef.current?.focus();
    } catch (err) {
      setComposeError('Send failed: ' + err.message);
    } finally {
      setComposeSending(false);
    }
  };

  const handleComposeKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComposeSend();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spinner size={24} /> Loading chat...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Alert type="error" msg={error} />
        <button
          onClick={onBack}
          style={{ ...S.btnGhost, marginTop: 16 }}
        >
          <ArrowUpRight size={12} style={{ transform: 'rotate(180deg)' }} /> Go Back
        </button>
      </div>
    );
  }

  if (!friend) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--muted)' }}>
        Friend not found
        <button
          onClick={onBack}
          style={{ ...S.btnGhost, marginTop: 16, display: 'block', margin: '16px auto 0' }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxWidth: 700,
        margin: '0 auto',
        padding: '0 16px',
      }}
      className="fu"
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 0',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <button onClick={onBack} style={S.btnGhost}>
          <ArrowUpRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back
        </button>
        <Avatar name={friend.name} size={36} fontSize={15} src={friend.avatar_url} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 15 }}>
            {friend.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>{friend.email}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              ...S.card,
              textAlign: 'center',
              color: 'var(--muted)',
              padding: 48,
            }}
          >
            No messages yet — say hello below!
          </div>
        ) : (
          notifications.map((n) => {
            const isMe = String(n.sender_id) === String(me.id);
            const isExpanded = expandedIds.has(n.id);
            const desc = n.description || '';
            const needsTruncate = desc.length > 150;
            const displayText =
              needsTruncate && !isExpanded ? desc.slice(0, 150) + '…' : desc;

            return (
              <div key={n.id} style={{ marginBottom: 6 }}>
                <div
                  style={{
                    ...S.card,
                    marginLeft: isMe ? 60 : 0,
                    marginRight: isMe ? 0 : 60,
                    background: isMe ? 'var(--ag)' : 'var(--s1)',
                    borderColor: isMe ? 'var(--a2)' : 'var(--border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                      gap: 8,
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{n.item_name}</span>
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--muted)',
                        flexShrink: 0,
                      }}
                    >
                      {fmt(n.timestamp)}
                    </span>
                  </div>

                  {desc && (
                    <>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text)',
                          marginBottom: needsTruncate ? 4 : 8,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.55,
                        }}
                      >
                        {displayText}
                      </p>
                      {needsTruncate && (
                        <button
                          onClick={() => toggleExpand(n.id)}
                          style={{
                            fontSize: 11,
                            color: 'var(--c)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            marginBottom: 8,
                          }}
                        >
                          {isExpanded ? 'View less' : 'View more'}
                        </button>
                      )}
                    </>
                  )}

                  {n.media && n.media.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      {n.media.map((m) => (
                        <a
                          key={m.id}
                          href={getMediaUrl(m.url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {m.media_type === 'image' ? (
                            <img
                              src={getMediaUrl(m.url)}
                              alt=""
                              onError={(e) => (e.target.style.display = 'none')}
                              style={{
                                width: 80,
                                height: 60,
                                borderRadius: 6,
                                objectFit: 'cover',
                                border: '1px solid var(--border)',
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 80,
                                height: 60,
                                background: 'var(--s3)',
                                borderRadius: 6,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <Film size={16} style={{ color: 'var(--c)' }} />
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--muted)',
                      marginTop: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{isMe ? 'You' : friend.name}</span>
                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === n.id ? null : n.id)
                      }
                      style={{
                        fontSize: 11,
                        color: 'var(--c)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      {replyingTo === n.id ? 'Cancel' : 'Reply'}
                    </button>
                  </div>
                </div>

                {replyingTo === n.id && (
                  <div
                    style={{
                      marginLeft: isMe ? 60 : 0,
                      marginRight: isMe ? 0 : 60,
                      marginTop: 4,
                      marginBottom: 12,
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-end',
                    }}
                  >
                    <textarea
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleReply(n.id);
                        }
                      }}
                      placeholder="Type a reply… (Enter to send)"
                      style={{
                        ...S.input,
                        minHeight: 52,
                        resize: 'vertical',
                        flex: 1,
                        fontSize: 12,
                      }}
                    />
                    <button
                      onClick={() => handleReply(n.id)}
                      style={{ ...S.btnPrimary, padding: '10px 14px' }}
                    >
                      <Send size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
          paddingBottom: 16,
          flexShrink: 0,
          background: 'var(--bg)',
        }}
      >
        {showTitleInput && (
          <input
            type="text"
            value={composeTitle}
            onChange={(e) => setComposeTitle(e.target.value)}
            placeholder="Message title (optional)"
            style={{ ...S.input, marginBottom: 8, fontSize: 12 }}
          />
        )}

        {composeMedia.length > 0 && (
          <div
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}
          >
            {composeMedia.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: 'var(--s2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 11,
                }}
              >
                {m.media_type === 'image' ? (
                  <Image size={11} style={{ color: 'var(--c)' }} />
                ) : (
                  <Film size={11} style={{ color: 'var(--c)' }} />
                )}
                <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.url.split('/').pop()}
                </span>
                <X
                  size={11}
                  style={{ cursor: 'pointer', color: 'var(--red)' }}
                  onClick={() =>
                    setComposeMedia((prev) => prev.filter((_, i) => i !== idx))
                  }
                />
              </div>
            ))}
          </div>
        )}

        {composeError && (
          <Alert type="error" msg={composeError} />
        )}

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowTitleInput((v) => !v)}
            title="Add a message title"
            style={{
              ...S.btnGhost,
              padding: '10px 10px',
              borderColor: showTitleInput ? 'var(--a)' : 'var(--border)',
              color: showTitleInput ? 'var(--a)' : 'var(--muted)',
              flexShrink: 0,
            }}
          >
            <Edit3 size={13} />
          </button>

          <textarea
            ref={composeInputRef}
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            onKeyDown={handleComposeKeyDown}
            placeholder={`Message ${friend.name}… (Enter to send, Shift+Enter for newline)`}
            rows={1}
            style={{
              ...S.input,
              flex: 1,
              resize: 'none',
              fontSize: 13,
              lineHeight: 1.5,
              minHeight: 42,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          />

          <input
            type="file"
            ref={composeFileRef}
            style={{ display: 'none' }}
            onChange={handleComposeUpload}
          />
          <button
            type="button"
            onClick={() => composeFileRef.current?.click()}
            disabled={composeUploading}
            title="Attach file"
            style={{ ...S.btnGhost, padding: '10px 10px', flexShrink: 0 }}
          >
            {composeUploading ? <Spinner size={13} /> : <Upload size={13} />}
          </button>

          <button
            type="button"
            onClick={handleComposeSend}
            disabled={
              composeSending ||
              (!composeText.trim() && composeMedia.length === 0)
            }
            style={{ ...S.btnPrimary, padding: '10px 14px', flexShrink: 0 }}
          >
            {composeSending ? <Spinner size={13} color="#000" /> : <Send size={13} />}
          </button>
        </div>
      </div>
    </div>
  );
}