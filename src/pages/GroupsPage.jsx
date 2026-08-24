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


/* ─── GROUPS PAGE ─────────────────────────────────────────────────────────── */
export default function GroupsPage({ api, me, onOpenChat }) {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [managingGroup, setManagingGroup] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState(new Set());
  const [memberSearch, setMemberSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, f] = await Promise.all([api("/groups"), api("/friends")]);
      setGroups(g || []);
      setFriends((f || []).filter(fr => fr.status === "accepted"));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setNewGroupName("");
    setSelectedMemberIds(new Set());
    setMemberSearch("");
    setErr("");
    setShowCreate(true);
  };

  const toggleMember = (id) => {
    setSelectedMemberIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!newGroupName.trim()) return setErr("Group name is required");
    setSaving(true); setErr("");
    try {
      await api("/groups", { method: "POST", body: { name: newGroupName.trim(), member_ids: [...selectedMemberIds] } });
      setShowCreate(false);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleRename = async (id) => {
    if (!editingGroup?.name.trim()) return;
    setSaving(true); setErr("");
    try {
      await api(`/groups/${id}`, { method: "PUT", body: { name: editingGroup.name.trim() } });
      setEditingGroup(null);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this group?")) return;
    try {
      await api(`/groups/${id}`, { method: "DELETE" });
      setManagingGroup(null);
      await load();
    } catch (e) { alert(e.message); }
  };

  const handleAddMember = async (groupId, userId) => {
    try {
      const updated = await api(`/groups/${groupId}/members`, { method: "POST", body: { user_id: userId } });
      setManagingGroup(updated);
      await load();
    } catch (e) { alert(e.message); }
  };

  const handleRemoveMember = async (groupId, userId) => {
    try {
      const updated = await api(`/groups/${groupId}/members/${userId}`, { method: "DELETE" });
      setManagingGroup(updated);
      await load();
    } catch (e) { alert(e.message); }
  };

  const filteredFriends = friends.filter(f =>
    !memberSearch || f.name?.toLowerCase().includes(memberSearch.toLowerCase()) || f.email?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const addableFriends = managingGroup
    ? friends.filter(f => !managingGroup.members?.some(m => m.id === f.id))
    : [];

  return (
    <div style={{ padding: "24px 16px", maxWidth: 800, margin: "0 auto" }} className="fu">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--fd)", fontWeight: 800, fontSize: 24, marginBottom: 4 }}>Groups</h2>
          <p style={{ color: "var(--muted)", fontSize: 12 }}>Organise your friends into named groups</p>
        </div>
        <button onClick={openCreate} style={S.btnPrimary}>
          <Plus size={12} /> New Group
        </button>
      </div>

      <alert type="error" msg={err} />

      {/* ── Create modal ── */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 420 }} className="fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 16 }}>Create Group</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={16} /></button>
            </div>

            <alert type="error" msg={err} />

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Group Name <span style={{ color: "var(--a)" }}>*</span></label>
              <input
                style={S.input}
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="e.g. Close Friends, Work Team…"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Add Friends ({selectedMemberIds.size} selected)</label>
              <input
                style={{ ...S.input, marginBottom: 8 }}
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                placeholder="Search friends…"
              />
              {friends.length === 0 ? (
                <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "12px 0" }}>No accepted friends yet</div>
              ) : (
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 0" }}>
                  {filteredFriends.map(f => (
                    <label key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid var(--border)" }}>
                      <input type="checkbox" checked={selectedMemberIds.has(f.id)} onChange={() => toggleMember(f.id)} style={{ accentColor: "var(--a)", width: 14, height: 14, flexShrink: 0 }} />
                      <Avatar name={f.name} size={28} fontSize={11} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.email}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleCreate} disabled={saving} style={{ ...S.btnPrimary, flex: 1, justifyContent: "center" }}>
                {saving ? <Spinner size={12} color="#000" /> : <><Check size={12} /> Create</>}
              </button>
              <button onClick={() => setShowCreate(false)} style={S.btnGhost}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage members modal ── */}
      {managingGroup && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setManagingGroup(null); }}>
          <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 440, maxHeight: "80vh", overflowY: "auto" }} className="fu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 16 }}>"{managingGroup.name}"</h3>
              <button onClick={() => setManagingGroup(null)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}><X size={16} /></button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Members ({managingGroup.members?.length || 0})</label>
              {(!managingGroup.members || managingGroup.members.length === 0) ? (
                <div style={{ fontSize: 12, color: "var(--muted)", padding: "10px 0" }}>No members yet</div>
              ) : (
                managingGroup.members.map(m => (
                  <div key={m.id} style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar name={m.name} size={32} fontSize={12} src={m.avatar_url} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.email}</div>
                      </div>
                    </div>
                    {managingGroup.owner_id === me?.id && (
                      <button onClick={() => handleRemoveMember(managingGroup.id, m.id)} style={{ ...S.btnDanger, padding: "5px 10px", fontSize: 10, flexShrink: 0 }}>
                        <X size={10} /> Remove
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {managingGroup.owner_id === me?.id && addableFriends.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Add More Friends</label>
                {addableFriends.map(f => (
                  <div key={f.id} style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <Avatar name={f.name} size={32} fontSize={12} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.email}</div>
                      </div>
                    </div>
                    <button onClick={() => handleAddMember(managingGroup.id, f.id)} style={{ ...S.btnPrimary, padding: "5px 10px", fontSize: 10, flexShrink: 0 }}>
                      <Plus size={10} /> Add
                    </button>
                  </div>
                ))}
              </div>
            )}

            {managingGroup.owner_id === me?.id && (
              <button onClick={() => handleDelete(managingGroup.id)} style={{ ...S.btnDanger, width: "100%", justifyContent: "center" }}>
                <Trash2 size={12} /> Delete Group
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Groups list ── */}
      {loading ? (
        <div style={{ ...S.card, textAlign: "center", color: "var(--muted)", padding: 48 }}>
          <Spinner size={20} />
        </div>
      ) : groups.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", color: "var(--muted)", padding: 48 }}>
          <Layers size={32} style={{ opacity: 0.3, marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
          <p style={{ marginBottom: 16 }}>No groups yet. Create one from your friends.</p>
          <button onClick={openCreate} style={S.btnPrimary}><Plus size={12} /> Create First Group</button>
        </div>
      ) : (
        groups.map(g => {
          const isOwner = g.owner_id === me?.id;
          const isEditing = editingGroup?.id === g.id;
          return (
            <div key={g.id} style={{ ...S.card, marginBottom: 12 }} className="fu">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditing ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        style={{ ...S.input, flex: 1, padding: "6px 10px", fontSize: 13 }}
                        value={editingGroup.name}
                        onChange={e => setEditingGroup(prev => ({ ...prev, name: e.target.value }))}
                        autoFocus
                        onKeyDown={e => { if (e.key === "Enter") handleRename(g.id); if (e.key === "Escape") setEditingGroup(null); }}
                      />
                      <button onClick={() => handleRename(g.id)} disabled={saving} style={{ ...S.btnPrimary, padding: "6px 12px" }}>
                        {saving ? <Spinner size={10} color="#000" /> : <Save size={11} />}
                      </button>
                      <button onClick={() => setEditingGroup(null)} style={{ ...S.btnGhost, padding: "6px 10px" }}><X size={11} /></button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Layers size={14} style={{ color: "var(--a)", flexShrink: 0 }} />
                      <span style={{ fontFamily: "var(--fd)", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.name}</span>
                      {isOwner && (
                        <span style={{ fontSize: 9, background: "var(--ag)", color: "var(--a)", border: "1px solid var(--a2)", padding: "2px 6px", borderRadius: 4, flexShrink: 0 }}>owner</span>
                      )}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => onOpenChat(g)} style={{ ...S.btnPrimary, padding: "7px 12px", fontSize: 11 }}>
                      <MessageSquare size={11} /> Chat
                    </button>
                    <button onClick={() => setManagingGroup(g)} style={{ ...S.btnGhost, padding: "7px 12px", fontSize: 11 }}>
                      <Users size={11} /> Manage
                    </button>
                    {isOwner && (
                      <button onClick={() => setEditingGroup({ id: g.id, name: g.name })} style={{ ...S.btnGhost, padding: "7px 10px" }}>
                        <Edit3 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Member avatar strip */}
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {g.members && g.members.length > 0 ? (
                  <>
                    {g.members.slice(0, 8).map(m => (
                      <div key={m.id} title={m.name} style={{ flexShrink: 0 }}>
                        <Avatar name={m.name} size={28} fontSize={10} src={m.avatar_url} />
                      </div>
                    ))}
                    {g.members.length > 8 && (
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>+{g.members.length - 8} more</span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 4 }}>
                      {g.members.length} member{g.members.length !== 1 ? "s" : ""}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>No members — click Manage to add</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

