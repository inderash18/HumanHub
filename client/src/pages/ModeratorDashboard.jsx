import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import EmptyState from '../components/common/EmptyState';
import Button from '../components/ui/Button';

export default function ModeratorDashboard() {
  const { user } = useAuthStore();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return <Navigate to="/feed" replace />;
  }

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/moderation/queue').catch(() => ({ data: [] }));
      setQueue(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (itemId, action) => {
    try {
      await api.post(`/moderation/${itemId}/${action}`);
      toast.success(`Item marked as ${action}`);
      setQueue((prev) => prev.filter(item => item._id !== itemId));
    } catch (err) {
      toast.error(`Failed to ${action} item`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 select-none space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--danger)]/15 border border-[var(--danger)]/30 flex items-center justify-center text-[var(--danger)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              Moderation Dashboard
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">Review flagged and reported content to keep HumanHub safe.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-[var(--text-tertiary)]">
          Loading moderation queue...
        </div>
      ) : queue.length > 0 ? (
        <div className="space-y-4">
          {queue.map((item) => (
            <div
              key={item._id}
              className="p-5 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-md">
                  {item.reason || 'Flagged Content'}
                </span>
                <p className="text-xs text-[var(--text-primary)] mt-1 font-medium">{item.contentSummary || 'User content report'}</p>
                <p className="text-[11px] text-[var(--text-tertiary)]">Reported by: @{item.reportedBy?.username || 'user'}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAction(item._id, 'approve')}
                  icon={CheckCircle2}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleAction(item._id, 'remove')}
                  icon={XCircle}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShieldCheck}
          title="Queue is Clear"
          description="There are no pending reports or moderation items to review."
        />
      )}
    </div>
  );
}
