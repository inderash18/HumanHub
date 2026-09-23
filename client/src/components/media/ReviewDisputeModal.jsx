import React, { useState } from 'react';
import { X, Flag, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';

export default function ReviewDisputeModal({
  isOpen,
  onClose,
  mediaId,
  onSubmitted
}) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      return toast.error('Please provide a reason for the dispute request.');
    }

    try {
      setIsSubmitting(true);
      await api.post(`/v1/media/${mediaId}/analysis/review-request`, {
        reason: reason.trim()
      });
      toast.success('Dispute submitted for moderator review.');
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-[2px] flex items-center justify-center p-4 select-none animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-2xl z-10 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="font-semibold text-sm text-[var(--text-primary)]">
              Request Origin Review
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <p className="text-[var(--text-secondary)] leading-relaxed">
            If you believe the automated analysis result for this media is inaccurate (e.g. camera capture misclassified due to heavy compression or editing), provide details for our moderation team.
          </p>

          <div>
            <label className="block font-medium text-[var(--text-primary)] mb-1">
              Dispute Details & Capture Context
            </label>
            <textarea
              rows={4}
              placeholder="Describe camera gear, raw capture workflow, or editing software used..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-xs rounded-lg p-2.5 outline-none focus:border-[var(--text-secondary)] resize-none"
              required
              maxLength={1000}
            />
            <span className="text-[10px] text-[var(--text-tertiary)] block text-right mt-1">
              {reason.length}/1000 characters
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
            >
              Submit Dispute
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
