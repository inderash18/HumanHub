import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  UserX,
  Sparkles,
  Layers
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import ModerationQueue from '../components/moderation/ModerationQueue';
import OriginReviewQueue from '../components/moderation/OriginReviewQueue';
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
  const [activeTab, setActiveTab] = useState('origin_disputes'); // origin_disputes | post_queue

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
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0095F6]/15 border border-[#0095F6]/30 flex items-center justify-center text-[#0095F6]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Moderation & Origin Center
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Review flagged submissions and resolve disputed AI/authenticity origin claims.
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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
                className={`p-4 rounded-xl bg-[var(--surface)] border ${config.border} shadow-sm space-y-1.5`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">{config.label}</span>
                  <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--text-primary)]">
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Queue Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('origin_disputes')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'origin_disputes'
                ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#0095F6]" />
            Disputed Origin Reviews
          </button>
          <button
            onClick={() => setActiveTab('post_queue')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'post_queue'
                ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Flagged Post Queue
          </button>
        </div>

        {activeTab === 'origin_disputes' ? (
          <OriginReviewQueue />
        ) : (
          <ModerationQueue />
        )}
      </div>
    </div>
  );
}
