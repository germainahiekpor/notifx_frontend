import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Menu } from 'lucide-react';

import { BASE, WS_BASE } from './constants';
import { useGlobalCSS } from './styles/global';
import { parseJWT, makeApi } from './utils';
import { useWebSocketNotifications } from './hooks/useWebSocket';
import Sidebar from './components/atoms/Sidebar';
import LandingPage from './pages/LandingPage';
import NotificationsPage from './pages/NotificationsPage';
import SendPage from './pages/SendPage';
import UsersPage from './pages/UsersPage';
import FriendsPage from './pages/FriendsPage';
import ProfilePage from './pages/ProfilePage';
import FriendDetailPage from './pages/FriendDetailPage';
import GroupsPage from './pages/GroupsPage';
import GroupChatPage from './pages/GroupChatPage';

export default function App() {
  useGlobalCSS();
  const [token, setToken] = useState(() => localStorage.getItem('th_token'));
  const [me, setMe] = useState(null);
  const [page, setPage] = useState('notifications');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);

  // FIX 2: useMemo instead of useCallback(makeApi(token), ...) which was incorrect
  const api = useMemo(() => makeApi(token), [token]);

  // FIX 3: wrap loadAll in useCallback so it can be safely listed as a useEffect dep
  const loadAll = useCallback(async () => {
    if (!token) return;
    try {
      const [notifs, userList] = await Promise.all([api('/notifications'), api('/users')]);
      setNotifications(notifs || []);
      setUsers(userList || []);
    } catch (err) {
      if (err.message.includes('41')) handleLogout();
    }
  }, [token, api]);

  const handleNewNotification = useCallback((notif) => {
    setNotifications(prev => {
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
  }, []);

  const handleUsersList = useCallback((list) => {
    setUsers(list);
  }, []);

  useWebSocketNotifications(token, handleNewNotification, handleUsersList);

  const handleAuth = async (tok) => {
    localStorage.setItem('th_token', tok);
    const claims = parseJWT(tok);
    const id = claims.user_id;
    try {
      const user = await makeApi(tok)(`/users/${id}`);
      setToken(tok);
      setMe(user);
    } catch {
      setToken(tok);
      setMe({ id, name: 'Connected Account', email: '' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('th_token');
    setToken(null);
    setMe(null);
    setNotifications([]);
    setUsers([]);
  };

  useEffect(() => {
    if (token) {
      const claims = parseJWT(token);
      if (claims.user_id) {
        makeApi(token)(`/users/${claims.user_id}`)
          .then(setMe)
          .catch(() => setMe({ id: claims.user_id, name: 'Connected Account' }));
      }
    }
  }, [token]);

  // FIX 3: loadAll is now stable via useCallback, safe to include in deps
  useEffect(() => {
    if (token) loadAll();
  }, [token, loadAll]);

  if (!token) return <LandingPage onAuth={handleAuth} />;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', flexDirection: 'row' }}>
      <div style={{ display: 'block' }} className="desktop-nav-container">
        <Sidebar page={page} setPage={setPage} me={me} onLogout={handleLogout} />
      </div>

      {mobileMenuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileMenuOpen(false)} />
          <div style={{ position: 'relative', width: 240, height: '100%', background: 'var(--s1)', display: 'flex', flexDirection: 'column' }}>
            <Sidebar page={page} setPage={(p) => { setPage(p); setMobileMenuOpen(false); }} me={me} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <div style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--s1)', borderBottom: '1px solid var(--border)' }} className="mobile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--fd)', fontWeight: 800, color: 'var(--a)' }}>NOTIF</span>
            <span style={{ fontFamily: 'var(--fd)', color: 'var(--text)' }}>X</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
            <Menu size={20} />
          </button>
        </div>

        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', width: '100%' }}>
          {page === 'notifications' && <NotificationsPage notifications={notifications} me={me} users={users} onRefresh={loadAll} api={api} />}
          {page === 'send' && <SendPage api={api} users={users} me={me} onSent={() => { loadAll(); setPage('notifications'); }} />}
          {page === 'users' && <UsersPage users={users} />}
          {page === 'friends' && <FriendsPage
            api={api}
            users={users}
            me={me}
            onRefresh={loadAll}
            token={token}
            onSelectFriend={(id) => {
              setSelectedFriendId(id);
              setPage('friend-detail');
            }}
          />}
          {page === 'friend-detail' && <FriendDetailPage
            api={api}
            friendId={selectedFriendId}
            me={me}
            onBack={() => setPage('friends')}
          />}
          {page === 'profile' && <ProfilePage api={api} me={me} onUpdate={setMe} onDelete={handleLogout} />}
          {page === "groups" && <GroupsPage api={api} me={me} onOpenChat={(g) => { setSelectedGroupId(g); setPage("group-chat"); }} />}
          {page === "group-chat" && <GroupChatPage api={api} me={me} groupId={selectedGroupId} token={token} onBack={() => setPage("groups")} />}
        </main>
      </div>

      <style>{`
        @media(max-width: 768px) {
          .desktop-nav-container { display: none!important; }
          .mobile-header { display: flex!important; }
        }
      `}</style>
    </div>
  );
}
