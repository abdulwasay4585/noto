import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Plus, Hash, Trophy, AlertCircle, Loader2,
  Copy, Check, Star, BookOpen, Zap, ArrowRight,
  RefreshCw, Crown, Medal, Award
} from 'lucide-react';
import { createStudyGroup, joinStudyGroup, fetchGroupLeaderboard } from '../api';

const SESSION_KEY = 'noto-session-id';
function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) { id = 'user-' + crypto.randomUUID().slice(0, 8); localStorage.setItem(SESSION_KEY, id); }
  return id;
}

const RANK_ICONS = [
  <Crown size={18} className="text-yellow-400" />,
  <Medal size={18} className="text-slate-400" />,
  <Award size={18} className="text-amber-600" />,
];

interface Group {
  id: number;
  name: string;
  invite_code: string;
}

interface Member {
  user_session_id: string;
  points: number;
  joined_at: string;
}

interface GroupData {
  group: Group;
  members: Member[];
}

export default function StudyGroups() {
  const [view, setView] = useState<'home' | 'create' | 'join' | 'group'>('home');
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const mySession = getSessionId();

  const loadGroup = useCallback(async (id: number) => {
    try {
      const res = await fetchGroupLeaderboard(id);
      setGroupData({ group: res.group, members: Array.isArray(res.members) ? res.members : [] });
      setView('group');
    } catch {
      setError('Could not load group data.');
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await createStudyGroup(groupName.trim());
      await loadGroup(res.id);
    } catch {
      setError('Could not create group. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError(null);
    try {
      const res = await joinStudyGroup(code);
      await loadGroup(res.group_id);
    } catch {
      setError('Invalid invite code. Double-check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!groupData) return;
    setRefreshing(true);
    try {
      const res = await fetchGroupLeaderboard(groupData.group.id);
      setGroupData({ group: res.group, members: Array.isArray(res.members) ? res.members : [] });
    } catch { /* silent */ }
    finally { setRefreshing(false); }
  };

  const copyCode = () => {
    if (!groupData) return;
    navigator.clipboard.writeText(groupData.group.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPoints = groupData?.members.reduce((s, m) => s + (m.points ?? 0), 0) ?? 0;
  const myMember   = groupData?.members.find(m => m.user_session_id === mySession);
  const myRank     = groupData ? (groupData.members.findIndex(m => m.user_session_id === mySession) + 1) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-6 lg:px-8 py-12 pb-28"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-10">

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3"
          style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
          Study Groups
        </h1>
        <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
          Create or join a collaborative study session. Share an invite code, compete on the leaderboard, and learn together.
        </p>
      </div>

      {/* ── Error ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl border mb-6 text-sm"
            style={{ backgroundColor: 'var(--noto-danger)' + '12', borderColor: 'var(--noto-danger)', color: 'var(--noto-danger)' }}
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto opacity-60 hover:opacity-100 text-xs">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Loading ─────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center py-20 gap-4">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--noto-primary)' }} />
          <p className="text-sm" style={{ color: 'var(--noto-text-secondary)' }}>
            {view === 'create' ? 'Creating your group…' : 'Joining group…'}
          </p>
        </div>
      )}

      {/* ── HOME view ───────────────────────────────────────────────── */}
      {!loading && view === 'home' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Create card */}
          <motion.button
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setView('create'); setError(null); }}
            className="p-8 rounded-3xl border text-left flex flex-col gap-4 cursor-pointer transition-shadow duration-200 hover:shadow-lg"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--noto-primary)' + '18' }}>
              <Plus size={22} style={{ color: 'var(--noto-primary)' }} />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                Create a Group
              </h2>
              <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                Start a new collaborative study session and invite your friends.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-auto" style={{ color: 'var(--noto-primary)' }}>
              Get started <ArrowRight size={13} />
            </div>
          </motion.button>

          {/* Join card */}
          <motion.button
            whileHover={{ y: -4, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setView('join'); setError(null); }}
            className="p-8 rounded-3xl border text-left flex flex-col gap-4 cursor-pointer transition-shadow duration-200 hover:shadow-lg"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--noto-success)' + '18' }}>
              <Hash size={22} style={{ color: 'var(--noto-success)' }} />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                Join a Group
              </h2>
              <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                Enter an invite code to join an existing study session.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-auto" style={{ color: 'var(--noto-success)' }}>
              Enter code <ArrowRight size={13} />
            </div>
          </motion.button>
        </div>
      )}

      {/* ── CREATE view ─────────────────────────────────────────────── */}
      {!loading && view === 'create' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => setView('home')} className="text-xs mb-5 flex items-center gap-1"
            style={{ color: 'var(--noto-text-secondary)' }}>
            ← Back
          </button>
          <div className="p-8 rounded-3xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <h2 className="font-bold text-xl mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              Create a New Group
            </h2>
            <p className="text-xs mb-7" style={{ color: 'var(--noto-text-secondary)' }}>
              A unique invite code will be generated - share it with anyone you want to study with.
            </p>
            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--noto-text-secondary)' }}>
                  Group Name
                </label>
                <input
                  type="text" required autoFocus
                  placeholder="e.g. A Level Chemistry Squad"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-primary)' }}
                  onFocus={e => (e.target.style.borderColor = 'var(--noto-primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--noto-border)')}
                />
              </div>
              <button type="submit"
                className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Plus size={16} /> Create Group
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* ── JOIN view ───────────────────────────────────────────────── */}
      {!loading && view === 'join' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <button onClick={() => setView('home')} className="text-xs mb-5 flex items-center gap-1"
            style={{ color: 'var(--noto-text-secondary)' }}>
            ← Back
          </button>
          <div className="p-8 rounded-3xl border" style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <h2 className="font-bold text-xl mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
              Join with Invite Code
            </h2>
            <p className="text-xs mb-7" style={{ color: 'var(--noto-text-secondary)' }}>
              Ask your group creator for the invite code and enter it below.
            </p>
            <form onSubmit={handleJoin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--noto-text-secondary)' }}>
                  Invite Code
                </label>
                <input
                  type="text" required autoFocus
                  placeholder="e.g. A1B2C3D4"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors text-center"
                  style={{
                    backgroundColor: 'var(--noto-surface-alt)',
                    borderColor: 'var(--noto-border)',
                    color: 'var(--noto-primary)',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '0.25em',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--noto-primary)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--noto-border)')}
                />
              </div>
              <button type="submit"
                className="btn-primary w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Hash size={16} /> Join Group
              </button>
            </form>
          </div>
        </motion.div>
      )}

      {/* ── GROUP / LEADERBOARD view ────────────────────────────────── */}
      {!loading && view === 'group' && groupData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">

          {/* Group header card */}
          <div className="p-6 rounded-3xl border"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                  {groupData.group.name}
                </h2>
              </div>

              {/* Invite code pill */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-4 py-2 rounded-xl border flex items-center gap-2"
                  style={{ backgroundColor: 'var(--noto-surface-alt)', borderColor: 'var(--noto-border)' }}>
                  <Hash size={13} style={{ color: 'var(--noto-text-secondary)' }} />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700, letterSpacing: '0.2em',
                    color: 'var(--noto-primary)', fontSize: '0.95rem'
                  }}>
                    {groupData.group.invite_code}
                  </span>
                  <button onClick={copyCode}
                    className="ml-1 p-1 rounded transition-colors"
                    style={{ color: copied ? 'var(--noto-success)' : 'var(--noto-text-secondary)' }}
                    title="Copy invite code">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--noto-border)' }}>
              {[
                { icon: <Users size={14} />, label: 'Members', value: groupData.members.length },
                { icon: <Star size={14} />, label: 'Total Points', value: totalPoints },
                { icon: <Trophy size={14} />, label: 'Your Rank', value: myRank > 0 ? `#${myRank}` : '–' },
              ].map(({ icon, label, value }) => (
                <div key={label} className="text-center">
                  <div className="flex items-center justify-center gap-1 text-xs mb-1"
                    style={{ color: 'var(--noto-text-secondary)' }}>
                    {icon} {label}
                  </div>
                  <div className="text-xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif', color: 'var(--noto-text-primary)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My points card (if member) */}
          {myMember && (
            <div className="p-4 rounded-2xl flex items-center gap-4"
              style={{ backgroundColor: 'var(--noto-primary)' + '12', border: '1px solid var(--noto-primary)' + '30' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--noto-primary)' }}>
                <Zap size={16} color="#fff" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: 'var(--noto-primary)' }}>You</p>
                <p className="text-sm font-bold" style={{ color: 'var(--noto-text-primary)' }}>
                  {myMember.points ?? 0} points · Rank #{myRank}
                </p>
              </div>
              <p className="text-xs" style={{ color: 'var(--noto-text-secondary)' }}>
                Complete tasks to earn more points
              </p>
            </div>
          )}

          {/* Points guide */}
          <div className="p-4 rounded-2xl border flex flex-wrap gap-x-6 gap-y-2 text-xs"
            style={{ backgroundColor: 'var(--noto-surface)', borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}>
            {[
              ['📋 Complete study task', '+10 pts'],
              ['🃏 Pass a flashcard', '+2 pts'],
              ['🎯 Mock exam > 70%', '+25 pts'],
            ].map(([label, pts]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span>{label}</span>
                <span className="font-bold" style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--noto-primary)' }}>{pts}</span>
              </div>
            ))}
          </div>

          {/* Leaderboard */}
          <div className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--noto-border)' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4"
              style={{ backgroundColor: 'var(--noto-primary-dark)' }}>
              <div className="flex items-center gap-2">
                <Trophy size={16} color="#fff" />
                <span className="text-sm font-bold text-white">Leaderboard</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }}>
                  {groupData.members.length} members
                </span>
              </div>
              <button onClick={handleRefresh}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                title="Refresh leaderboard">
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {groupData.members.length === 0 ? (
              <div className="flex flex-col items-center py-14 gap-3"
                style={{ backgroundColor: 'var(--noto-surface)', color: 'var(--noto-text-secondary)' }}>
                <BookOpen size={28} style={{ opacity: 0.3 }} />
                <p className="text-sm">No members yet. Share the invite code!</p>
              </div>
            ) : (
              <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--noto-border)' } as any}>
                {groupData.members.map((m, i) => {
                  const isMe = m.user_session_id === mySession;
                  return (
                    <motion.div
                      key={m.user_session_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
                      className="flex items-center gap-4 px-6 py-4"
                      style={{
                        backgroundColor: i === 0
                          ? 'var(--noto-primary)' + '08'
                          : isMe
                          ? 'var(--noto-success)' + '06'
                          : 'var(--noto-surface)',
                        borderBottom: '1px solid var(--noto-border)',
                      }}
                    >
                      {/* Rank */}
                      <div className="w-8 shrink-0 flex items-center justify-center">
                        {i < 3 ? RANK_ICONS[i] : (
                          <span className="text-xs font-mono font-bold"
                            style={{ color: 'var(--noto-text-secondary)' }}>#{i + 1}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                        style={{
                          backgroundColor: isMe ? 'var(--noto-primary)' : 'var(--noto-surface-alt)',
                          color: isMe ? '#fff' : 'var(--noto-text-secondary)',
                        }}>
                        {m.user_session_id.slice(-2).toUpperCase()}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate"
                          style={{ color: 'var(--noto-text-primary)' }}>
                          {isMe ? 'You' : `Member ${i + 1}`}
                          {i === 0 && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded font-bold"
                              style={{ backgroundColor: 'var(--noto-primary)' + '18', color: 'var(--noto-primary)' }}>
                              TOP
                            </span>
                          )}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--noto-text-secondary)' }}>
                          Joined {new Date(m.joined_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Points */}
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold" style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          color: i === 0 ? 'var(--noto-primary)' : 'var(--noto-text-primary)'
                        }}>
                          {m.points ?? 0}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--noto-text-secondary)' }}>pts</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => { setView('home'); setGroupData(null); setGroupName(''); setJoinCode(''); }}
              className="text-sm px-5 py-2.5 rounded-xl border font-medium transition-colors"
              style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'; }}
            >
              ← Leave / Switch Group
            </button>
            <button
              onClick={handleRefresh}
              className="text-sm px-5 py-2.5 rounded-xl border font-medium flex items-center gap-2 transition-colors"
              style={{ borderColor: 'var(--noto-border)', color: 'var(--noto-text-secondary)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--noto-primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--noto-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--noto-text-secondary)'; }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
