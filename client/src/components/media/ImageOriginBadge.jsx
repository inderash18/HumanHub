import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  Camera, 
  Loader2,
  Info,
  Lock
} from 'lucide-react';

/**
 * Compact Image Origin & Provenance Badge.
 */
export default function ImageOriginBadge({
  outcome,
  evidence,
  processingState,
  publicationDecision,
  onClick,
  size = 'sm',
  className = ''
}) {
  const isPending = processingState === 'QUEUED' || processingState === 'RUNNING' || outcome === 'PENDING' || publicationDecision === 'PENDING';
  
  let label = evidence?.badgeLabel || 'Origin check';
  let variant = evidence?.badgeVariant || 'neutral';
  let Icon = Info;

  if (isPending) {
    label = 'Checking image before publishing...';
    variant = 'pending';
    Icon = Loader2;
  } else if (outcome === 'GOOGLE_AI_ORIGIN_DOCUMENTED') {
    Icon = AlertTriangle;
    variant = 'danger';
    label = evidence?.badgeLabel || 'Google AI generation detected';
  } else if (outcome === 'GOOGLE_AI_EDITING_DOCUMENTED') {
    Icon = Sparkles;
    variant = 'info';
    label = evidence?.badgeLabel || 'Google AI editing detected';
  } else if (outcome === 'AI_ORIGIN_DOCUMENTED') {
    Icon = AlertTriangle;
    variant = 'danger';
    label = evidence?.badgeLabel || 'AI origin documented';
  } else if (outcome === 'AI_EDITING_DOCUMENTED') {
    Icon = Sparkles;
    variant = 'info';
    label = evidence?.badgeLabel || 'AI editing documented';
  } else if (outcome === 'LIKELY_AI_GENERATED') {
    Icon = AlertTriangle;
    variant = 'warning';
    label = evidence?.badgeLabel || 'Likely AI-generated';
  } else if (outcome === 'LIKELY_AUTHENTIC' || outcome === 'NO_STRONG_AI_SIGNALS') {
    if (evidence?.cameraOriginVerified) {
      Icon = Camera;
      variant = 'verified';
      label = evidence?.badgeLabel || 'Camera capture documented';
    } else {
      Icon = ShieldCheck;
      variant = 'verified';
      label = evidence?.badgeLabel || 'Likely authentic';
    }
  } else if (outcome === 'INCONCLUSIVE') {
    Icon = HelpCircle;
    variant = 'neutral';
    label = evidence?.badgeLabel || 'This image needs review';
  } else if (processingState === 'FAILED' || outcome === 'CHECK_UNAVAILABLE') {
    Icon = Info;
    variant = 'unavailable';
    label = evidence?.badgeLabel || 'Image check unavailable';
  }

  const variantStyles = {
    verified: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25',
    info: 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/25',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 hover:bg-[#F59E0B]/25',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25',
    neutral: 'bg-black/60 backdrop-blur-md text-white/90 border-white/15 hover:bg-black/80',
    unavailable: 'bg-white/10 text-white/70 border-white/15 hover:bg-white/15',
    pending: 'bg-black/60 backdrop-blur-md text-white/80 border-white/15'
  };

  const sizeStyles = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2'
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      aria-label={`Image origin: ${label}. Click for full evidence report.`}
      className={`
        inline-flex items-center font-medium rounded-full border transition-all duration-150 select-none shadow-sm cursor-pointer
        ${variantStyles[variant] || variantStyles.neutral}
        ${sizeStyles[size] || sizeStyles.sm}
        ${className}
      `}
    >
      <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isPending ? 'animate-spin' : ''}`} />
      <span className="truncate max-w-[170px] sm:max-w-[220px]">{label}</span>
    </button>
  );
}
