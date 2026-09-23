import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  Camera, 
  FileText, 
  Cpu, 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Flag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from '../ui/Button';
import ReviewDisputeModal from './ReviewDisputeModal';

export default function ImageOriginEvidenceModal({
  isOpen,
  onClose,
  analysisData,
  mediaUrl,
  isAuthor = false,
  onReviewSubmitted
}) {
  const [activeTab, setActiveTab] = useState('summary'); // summary | provenance | metadata | detector | diagnostics
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  if (!isOpen || !analysisData) return null;

  const {
    mediaId,
    analysisOutcome,
    processingState,
    evidence,
    provenance,
    metadata,
    diagnostics,
    policyVersion,
    reviewRequest
  } = analysisData;

  const isPending = processingState === 'QUEUED' || processingState === 'RUNNING';

  const getOutcomeHeader = () => {
    switch (analysisOutcome) {
      case 'AI_ORIGIN_DOCUMENTED':
        return {
          title: 'AI Origin Documented',
          badgeColor: 'text-[#0095F6] bg-[#0095F6]/10 border-[#0095F6]/30',
          icon: Sparkles,
          desc: 'Cryptographically signed Content Credentials confirm this image was generated using AI tools.'
        };
      case 'AI_EDITING_DOCUMENTED':
        return {
          title: 'AI Editing Documented',
          badgeColor: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30',
          icon: Sparkles,
          desc: 'Content Credentials confirm generative AI tools were used during the creation or editing of this media.'
        };
      case 'LIKELY_AI_GENERATED':
        return {
          title: 'Likely AI-Generated',
          badgeColor: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30',
          icon: AlertTriangle,
          desc: 'Statistical pixel analysis and metadata patterns indicate characteristics typical of synthetic media.'
        };
      case 'NO_STRONG_AI_SIGNALS':
        return {
          title: evidence?.cameraOriginVerified ? 'Camera Capture Documented' : 'No Strong AI Signals Detected',
          badgeColor: 'text-[#00BA88] bg-[#00BA88]/10 border-[#00BA88]/30',
          icon: evidence?.cameraOriginVerified ? Camera : ShieldCheck,
          desc: evidence?.cameraOriginVerified 
            ? 'Hardware Content Credentials verify this image originated from a physical camera sensor.'
            : 'No synthetic pixel patterns or AI generation credentials were identified during automated analysis.'
        };
      case 'INCONCLUSIVE':
        return {
          title: 'Inconclusive Result',
          badgeColor: 'text-[var(--text-secondary)] bg-[var(--surface-elevated)] border-[var(--border)]',
          icon: HelpCircle,
          desc: 'Evidence is ambiguous or intermediate. The system abstains from making a definitive determination.'
        };
      default:
        return {
          title: isPending ? 'Analyzing Media...' : 'Origin Check Unavailable',
          badgeColor: 'text-[var(--text-tertiary)] bg-[var(--surface-elevated)] border-[var(--border)]',
          icon: AlertCircle,
          desc: isPending 
            ? 'Background verification and model inference are currently processing.'
            : 'Automated pixel model or credential verification was not available for this upload.'
        };
    }
  };

  const header = getOutcomeHeader();
  const HeaderIcon = header.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)]">
              Media Origin & Provenance
            </h2>
            <span className="text-[10px] font-mono text-[var(--text-tertiary)] px-1.5 py-0.5 rounded bg-[var(--surface-elevated)]">
              v{policyVersion || '2026.1'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* Outcome Hero Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${header.badgeColor}`}>
            <HeaderIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm">
                {header.title}
              </h3>
              <p className="text-xs opacity-90 mt-1 leading-relaxed">
                {evidence?.primaryExplanation || header.desc}
              </p>
            </div>
          </div>

          {/* Dispute Status Alert if pending */}
          {reviewRequest?.status === 'pending' && (
            <div className="p-3 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-center gap-2 text-xs text-[#F59E0B]">
              <Flag className="w-4 h-4 flex-shrink-0" />
              <span>A creator review request is currently pending evaluation by our moderation team.</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'summary' ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('provenance')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'provenance' ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              C2PA Credentials
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'metadata' ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Metadata (EXIF)
            </button>
            <button
              onClick={() => setActiveTab('detector')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'detector' ? 'bg-[var(--surface-elevated)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Pixel Model
            </button>
          </div>

          {/* Tab 1: Overview Summary */}
          {activeTab === 'summary' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-semibold text-[var(--text-primary)]">Key Findings</h4>
                <ul className="space-y-1.5 text-[var(--text-secondary)]">
                  {evidence?.detailedPoints?.length > 0 ? (
                    evidence.detailedPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0095F6] flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-[var(--text-tertiary)] italic">No specific anomaly markers recorded.</li>
                  )}
                </ul>
              </div>

              {/* Media Thumbnail & Hash */}
              {mediaUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
                  <img 
                    src={mediaUrl} 
                    alt="Analyzed media preview" 
                    className="w-12 h-12 object-cover rounded-lg border border-[var(--border)]" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                      Media ID: {mediaId || 'Active Item'}
                    </p>
                    <p className="text-[10px] font-mono text-[var(--text-tertiary)] truncate mt-0.5">
                      Analyzed unaltered source bytes
                    </p>
                  </div>
                </div>
              )}

              {/* Transparent Disclaimers */}
              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)]/50 border border-[var(--border)] space-y-1.5">
                <h5 className="font-semibold text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-[var(--text-tertiary)]" />
                  Transparency & Limitations
                </h5>
                <ul className="text-[10px] text-[var(--text-tertiary)] space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Automated pixel models evaluate statistical likelihood and never claim 100% certainty.</li>
                  <li>"No strong AI signals detected" does not guarantee an image is an authentic camera photograph.</li>
                  <li>Private fields (GPS coordinates, serial numbers) have been strictly stripped.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tab 2: C2PA Provenance */}
          {activeTab === 'provenance' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Manifest Present</span>
                  <span className={`font-semibold ${provenance?.manifestPresent ? 'text-[#00BA88]' : 'text-[var(--text-tertiary)]'}`}>
                    {provenance?.manifestPresent ? 'Yes (C2PA Detected)' : 'No C2PA Manifest'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Signature Status</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {provenance?.signatureValid ? 'Cryptographically Valid' : provenance?.manifestPresent ? 'Invalid / Untrusted' : 'N/A'}
                  </span>
                </div>

                {provenance?.signerName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Signer / Issuer</span>
                    <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                      {provenance.signerName} {provenance.issuer ? `(${provenance.issuer})` : ''}
                    </span>
                  </div>
                )}

                {provenance?.aiToolsMentioned?.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border)]">
                    <span className="text-[var(--text-secondary)] font-medium block mb-1">Declared AI Tools</span>
                    <div className="flex flex-wrap gap-1">
                      {provenance.aiToolsMentioned.map((tool, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#0095F6]/15 text-[#0095F6] text-[10px] font-semibold">
                          {tool}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                C2PA Content Credentials provide end-to-end cryptographic provenance from camera hardware, creative software, and AI generators.
              </p>
            </div>
          )}

          {/* Tab 3: Sanitized Metadata */}
          {activeTab === 'metadata' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Camera Equipment</span>
                  <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                    {metadata?.cameraMake || metadata?.cameraModel 
                      ? `${metadata.cameraMake || ''} ${metadata.cameraModel || ''}`.trim()
                      : 'Not present (Neutral)'}
                  </span>
                </div>

                {metadata?.lensModel && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Lens Model</span>
                    <span className="font-semibold text-[var(--text-primary)]">{metadata.lensModel}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Software Tag</span>
                  <span className="font-semibold text-[var(--text-primary)] truncate max-w-[200px]">
                    {metadata?.software || 'None reported'}
                  </span>
                </div>

                {metadata?.creationDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-secondary)] font-medium">Capture Timestamp</span>
                    <span className="font-mono text-[11px] text-[var(--text-primary)]">{metadata.creationDate}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                  <span className="text-[var(--text-secondary)] font-medium">Privacy Status</span>
                  <span className="text-[11px] text-[#00BA88] font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3" /> GPS & Serials Redacted
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                Unsigned metadata is informative supporting evidence. Absence of camera EXIF does not imply generative AI use.
              </p>
            </div>
          )}

          {/* Tab 4: Detector Model */}
          {activeTab === 'detector' && (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Primary Detector</span>
                  <span className="font-semibold text-[var(--text-primary)]">UniversalFakeDetect (ViT-L/14)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Inference Mode</span>
                  <span className="font-mono text-[11px] text-[var(--text-primary)]">Evaluation (torch.no_grad)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)] font-medium">Processing Status</span>
                  <span className="font-semibold text-[#00BA88]">{processingState || 'COMPLETED'}</span>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                UnivFD evaluates high-dimensional feature artifacts extracted by a frozen CLIP vision transformer paired with a calibrated linear classifier.
              </p>
            </div>
          )}

          {/* Collapsible Diagnostics for Author or Moderator */}
          {diagnostics && (
            <div className="pt-2 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className="flex items-center justify-between w-full text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium py-1"
              >
                <span>Diagnostic & Technical Inspection</span>
                {showDiagnostics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDiagnostics && (
                <div className="mt-2 p-3 rounded-lg bg-black/60 font-mono text-[10px] text-white/80 space-y-1 overflow-x-auto">
                  <p>SHA-256: {diagnostics.fileHash || 'N/A'}</p>
                  <p>Raw Score: {diagnostics.detector?.rawScore ?? 'N/A'}</p>
                  <p>Logit: {diagnostics.detector?.logit ?? 'N/A'}</p>
                  <p>Latency: {diagnostics.detector?.latencyMs ? `${diagnostics.detector.latencyMs} ms` : 'N/A'}</p>
                  <p>Checkpoint: {diagnostics.detector?.checkpointIdentifier || 'univfd_clip_vit_l14'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface-elevated)] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowDisputeModal(true)}
            className="text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
            Request Review
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

      {/* Review Dispute Modal */}
      {showDisputeModal && (
        <ReviewDisputeModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          mediaId={mediaId}
          onSubmitted={() => {
            setShowDisputeModal(false);
            if (onReviewSubmitted) onReviewSubmitted();
          }}
        />
      )}
    </div>
  );
}
