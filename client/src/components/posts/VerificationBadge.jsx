import React from 'react';
import { ShieldCheck, Clock, AlertOctagon, Sparkles } from 'lucide-react';

export default function VerificationBadge({ scores, status }) {
  const isFlagged = status === 'blocked';
  const isReviewing = status === 'pending_review';
  const aiScore = scores?.text?.score || scores?.combined || 0;
  const isHighRisk = aiScore > 0.7;

  if (isFlagged) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 shadow-sm shadow-[#EF4444]/20 backdrop-blur-md">
        <AlertOctagon className="w-3 h-3 flex-shrink-0" />
        Blocked
      </span>
    );
  }

  if (isReviewing || isHighRisk) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 shadow-sm shadow-[#F59E0B]/20 backdrop-blur-md">
        <Clock className="w-3 h-3 flex-shrink-0 animate-pulse" />
        Pending Review
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono-code font-bold uppercase tracking-wider bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 shadow-sm shadow-[#10B981]/20 backdrop-blur-md">
      <ShieldCheck className="w-3 h-3 flex-shrink-0 text-[#10B981]" />
      Human Verified
    </span>
  );
}
