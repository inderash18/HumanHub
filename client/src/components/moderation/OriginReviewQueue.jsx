import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Flag, 
  Check, 
  X, 
  HelpCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import UserAvatar from '../common/UserAvatar';

export default function OriginReviewQueue() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [notesMap, setNotesMap] = useState({});

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/media/reviews/queue');
      setReviews(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async (id, decision) => {
    try {
      setResolvingId(id);
      await api.post(`/v1/media/reviews/${id}/decide`, {
        decision,
        notes: notesMap[id] || ''
      });
      toast.success('Dispute resolved successfully');
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve dispute');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[var(--text-tertiary)] flex flex-col items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--text-secondary)] mb-2" />
        <span>Loading disputed origin reviews...</span>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-tertiary)] space-y-2">
        <ShieldCheck className="w-8 h-8 mx-auto text-[#00BA88] opacity-80" />
        <p className="font-semibold text-[var(--text-primary)]">No Pending Origin Disputes</p>
        <p>All creator review requests have been resolved by the moderation team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {reviews.map((item) => {
        const reqUser = item.reviewRequest?.requestedBy || item.owner || {};
        return (
          <div
            key={item._id}
            className="p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <UserAvatar src={reqUser.avatar} name={reqUser.displayName || reqUser.username} size="sm" />
                <div>
                  <span className="font-semibold text-sm text-[var(--text-primary)]">
                    {reqUser.username || 'Creator'}
                  </span>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    Submitted dispute on {new Date(item.reviewRequest?.requestedAt || item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
                  Outcome: {item.analysisOutcome}
                </span>
              </div>
            </div>

            {/* Media and Details Split */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Media Preview */}
              <div className="w-full md:w-48 h-48 bg-black rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-[var(--border)]">
                <img src={item.mediaUrl} alt="Disputed media" className="w-full h-full object-cover" />
              </div>

              {/* Dispute Reason & Details */}
              <div className="flex-1 space-y-3 text-xs">
                <div>
                  <h4 className="font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1.5 text-[11px]">
                    <Flag className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Creator Dispute Reason
                  </h4>
                  <p className="p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] leading-relaxed italic">
                    "{item.reviewRequest?.reason || 'No statement provided'}"
                  </p>
                </div>

                {/* Technical stats */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
                  <p><span className="font-medium text-[var(--text-tertiary)]">Camera:</span> {item.metadata?.cameraMake || 'None'} {item.metadata?.cameraModel || ''}</p>
                  <p><span className="font-medium text-[var(--text-tertiary)]">Software:</span> {item.metadata?.software || 'None'}</p>
                  <p><span className="font-medium text-[var(--text-tertiary)]">C2PA Status:</span> {item.provenance?.status || 'ABSENT'}</p>
                  <p><span className="font-medium text-[var(--text-tertiary)]">UnivFD Score:</span> {item.detector?.rawScore ?? 'N/A'}</p>
                </div>

                {/* Moderator Notes */}
                <div>
                  <input
                    type="text"
                    placeholder="Optional moderator resolution notes..."
                    value={notesMap[item._id] || ''}
                    onChange={(e) => setNotesMap(prev => ({ ...prev, [item._id]: e.target.value }))}
                    className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs text-[var(--text-primary)] rounded-lg p-2 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Decision Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDecide(item._id, 'mark_inconclusive')}
                disabled={resolvingId === item._id}
                icon={HelpCircle}
              >
                Mark Inconclusive
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDecide(item._id, 'confirm_ai')}
                disabled={resolvingId === item._id}
                icon={X}
              >
                Confirm AI
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleDecide(item._id, 'override_authentic')}
                disabled={resolvingId === item._id}
                icon={Check}
              >
                Verify Authentic
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
