import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ModerationQueue from '../components/moderation/ModerationQueue';
import api from '../services/api';

const STAT_CONFIG = {
  pending: { label: 'Pending Review', icon: FileText, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', border: 'border-[var(--warning)]/20' },
  published: { label: 'Published / Approved', icon: CheckCircle2, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', border: 'border-[var(--success)]/20' },
  blocked: { label: 'Blocked Content', icon: XCircle, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10', border: 'border-[var(--danger)]/20' },
  bannedUsers: { label: 'Suspended Users', icon: UserX, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10', border: 'border-[var(--danger)]/20' },
};

export default function ModeratorDashboard() {
  const { user } = useAuthStore();
  const authorized = ['admin', 'moderator'].includes(user?.role);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authorized) return;
    api.get('/moderation/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setError('Could not load moderation counts.'));
  }, [authorized]);

  if (!authorized) {
    return <Navigate to="/feed" replace />;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--danger)]/15 border border-[var(--danger)]/30 flex items-center justify-center text-[var(--danger)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Moderation Dashboard
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              Review flagged and pending submissions to ensure content authenticity and community safety.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs text-[var(--danger)] flex items-center gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats).map(([key, count]) => {
            const config = STAT_CONFIG[key] || {
              label: key,
              icon: FileText,
              color: 'text-[var(--text-primary)]',
              bg: 'bg-[var(--surface)]',
              border: 'border-[var(--border)]'
            };
            const Icon = config.icon;
            return (
              <div
                key={key}
                className={`p-5 rounded-2xl bg-[var(--surface)] border ${config.border} shadow-sm space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{config.label}</span>
                  <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-display text-[var(--text-primary)]">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Queue Component */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)] font-display">Review Queue</h2>
          <p className="text-xs text-[var(--text-tertiary)]">Items pending human verification and moderator action.</p>
        </div>
        <ModerationQueue />
      </div>
    </div>
  );
}
