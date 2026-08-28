import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X, Plus, Trash2 } from 'lucide-react';
import { WS_BASE } from '../constants';
import { S } from '../utils';
import { useGlobalCSS } from '../styles/global';
import Avatar from '../components/atoms/Avatar';
import Spinner from '../components/atoms/Spinner';

export default function FriendsPage({ api, users, me, onRefresh, token, onSelectFriend }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [search, setSearch] = useState('');
  const wsRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/friends');
      setFriends(data || []);
    } catch (e) {
      console.error('Failed to load friends:', e);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!token) return;

    const connectWS = () => {
      const wsUrl = `${WS_BASE}/ws?token=Bearer_${token}`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => console.log('Friends WS connected');

      wsRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'friend_request' || msg.type === 'friend_accepted' || msg.type === 'friend_removed') {
            console.log('Friend event:', msg.type, msg.from);
            load();
            onRefresh?.();
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Friends WS closed, reconnecting in 3s...');
        setTimeout(connectWS, 3000);
      };

      wsRef.current.onerror = (err) => {
        console.error('Friends WS error:', err);
        wsRef.current?.close();
      };
    };

    connectWS();
    return () => wsRef.current?.close();
  }, [token, load, onRefresh]);

  const incoming = friends.filter(f => f.status === 'incoming_pending');
  const outgoing = friends.filter(f => f.status === 'outgoing_pending');
  const accepted = friends.filter(f => f.status === 'accepted');

  const friendIds = new Set(friends.map(f => f.id));
  const availableUsers = users.filter(u => u.id !== me?.id && !friendIds.has(u.id));
  const filteredUsers = search.trim() ? availableUsers.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  ) : [];

  const sendRequest = async (id) => {
    setActionId(id);
    try {
      await api('/friends/request', { method: 'POST', body: { friend_id: id } });
      await load();
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const acceptRequest = async (id) => {
    setActionId(id);
    try {
      await api('/friends/accept', { method: 'POST', body: { friend_id: id } });
      await load();
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const cancelRequest = async (id) => {
    if (!window.confirm('Cancel this friend request?')) return;
    setActionId(id);
    try {
      await api(`/friends/${id}`, { method: 'DELETE' });
      await load();
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const removeFriend = async (id) => {
    if (!window.confirm('Remove this friend? They won\'t be notified.')) return;
    setActionId(id);
    try {
      await api(`/friends/${id}`, { method: 'DELETE' });
      await load();
      onRefresh?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setActionId(null);
    }
  };

  const getUserById = (id) => users.find(u => u.id === id) || { id, name: `User #${id}`, email: '' };

  const renderList = (list, type) => {
    if (loading && list.length === 0) {
      return <div style={{ ...S.card, textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>;
    }
    if (list.length === 0) {
      return <div style={{ ...S.card, textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No {type} connections</div>;
    }

    return list.map(f => {
      const user = getUserById(f.id);
      const isBusy = actionId === f.id;

      return (
          <div key={f.id} onClick={() => type === 'accepted' && onSelectFriend?.(f.id)}
               style={{
                 ...S.card,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between',
                 gap: 12,
                 marginBottom: 10,
                 cursor: type === 'accepted' ? 'pointer' : 'default'
               }} className="fu">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
              <Avatar name={user.name} size={44} fontSize={16} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
              {type === 'incoming' && (
                  <button
                      onClick={() => acceptRequest(f.id)}
                      disabled={isBusy}
                      style={{ ...S.btnPrimary, padding: '8px 14px', fontSize: 11 }}
                  >
                    {isBusy ? <Spinner size={12} color="#000" /> : <><Check size={12} /> Accept</>}
                  </button>
              )}

              {type === 'outgoing' && (
                  <button
                      onClick={() => cancelRequest(f.id)}
                      disabled={isBusy}
                      style={{ ...S.btnGhost, padding: '8px 14px', fontSize: 11, borderColor: 'var(--red)', color: 'var(--red)' }}
                  >
                    {isBusy ? <Spinner size={12} /> : <><X size={12} /> Cancel</>}
                  </button>
              )}

              {type === 'accepted' && (
                  <button
                      onClick={() => removeFriend(f.id)}
                      disabled={isBusy}
                      style={{ ...S.btnDanger, padding: '8px 14px', fontSize: 11 }}
                  >
                    {isBusy ? <Spinner size={12} /> : <><Trash2 size={12} /> Remove</>}
                  </button>
              )}
            </div>
          </div>
      );
    });
  };

  return (
      <div style={{ padding: '24px 16px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ color:'var(--text)', fontFamily: 'var(--fd)', fontWeight: 800, fontSize: 24, marginBottom: 4 }}>My friends</h2>
          <p style={{ color: 'var(--muted)', fontSize: 12 }}>Search for friends and add them to your circle</p>
        </div>

        <div style={{ marginBottom: 40 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Add Friends</h3>
          <div style={{ ...S.card, marginBottom: 12 }}>
            <input
                type="text"
                placeholder="Search users by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ ...S.input, marginBottom: 0 }}
            />
          </div>

          {search.trim() && (
              loading ? (
                  <div style={{ ...S.card, textAlign: 'center', color: 'var(--muted)' }}>Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                  <div style={{ ...S.card, textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                    No users found
                  </div>
              ) : (
                  filteredUsers.slice(0, 10).map(u => {
                    const isBusy = actionId === u.id;
                    return (
                        <div key={u.id} style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                            <Avatar name={u.name} size={44} fontSize={16} />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                            </div>
                          </div>
                          <button
                              onClick={() => sendRequest(u.id)}
                              disabled={isBusy}
                              style={{ ...S.btnPrimary, padding: '8px 14px', fontSize: 11 }}
                          >
                            {isBusy ? <Spinner size={12} color="#000" /> : <><Plus size={12} /> Add</>}
                          </button>
                        </div>
                    );
                  })
              )
          )}
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--c)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Incoming Requests ({incoming.length})</h3>
          {renderList(incoming, 'incoming')}
        </div>

        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--a)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Outgoing Requests ({outgoing.length})</h3>
          {renderList(outgoing, 'outgoing')}
        </div>

        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Friends ({accepted.length})</h3>
          {renderList(accepted, 'accepted')}
        </div>
      </div>
  );
}