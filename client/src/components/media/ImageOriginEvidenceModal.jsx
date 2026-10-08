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
  const [activeTab, setActiveTab] = useState('summary'); // summary | google | provenance | metadata | detector
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  if (!isOpen || !analysisData) return null;

  const {
    mediaId,
    analysisOutcome,
    publicationDecision,
    decisionReason,
    googleAiDetection,
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
      case 'GOOGLE_AI_ORIGIN_DOCUMENTED':
        return {
          title: 'Google AI Generation Detected',
          badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          icon: AlertTriangle,
          desc: 'Cryptographically signed C2PA credentials or SynthID verified that this image was generated with Google AI (Gemini / Imagen).'
        };
      case 'GOOGLE_AI_EDITING_DOCUMENTED':
        return {
          title: 'Google AI Editing Detected',
          badgeColor: 'text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/30',
          icon: Sparkles,
          desc: 'Content Credentials confirm generative AI tools were used during editing via Google AI tools.'
        };
      case 'AI_ORIGIN_DOCUMENTED':
        return {
          title: 'AI Origin Documented',
          badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
          icon: AlertTriangle,
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
      case 'LIKELY_AUTHENTIC':
      case 'NO_STRONG_AI_SIGNALS':
        return {
          title: evidence?.cameraOriginVerified ? 'Camera Capture Documented' : 'Likely Authentic',
          badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          icon: evidence?.cameraOriginVerified ? Camera : ShieldCheck,
          desc: evidence?.cameraOriginVerified 
            ? 'Hardware Content Credentials verify this image originated from a physical camera sensor.'
            : 'Pixel feature analysis and metadata inspection found no indicators of generative AI synthesis.'
        };
      case 'INCONCLUSIVE':
        return {
          title: 'Needs Review',
          badgeColor: 'text-[var(--text-secondary)] bg-[var(--surface-elevated)] border-[var(--border)]',
          icon: HelpCircle,
          desc: 'Evidence is intermediate or ambiguous. This image requires review before publishing.'
        };
      default:
        return {
          title: isPending ? 'Checking image before publishing...' : 'Held for Manual Review',
          badgeColor: 'text-[var(--text-tertiary)] bg-[var(--surface-elevated)] border-[var(--border)]',
          icon: AlertCircle,
          desc: isPending 
            ? 'Background verification and Content Credentials inspection in progress.'
            : (evidence?.primaryExplanation || 'Automated AI check is currently unavailable. Your post is held for manual review.')
        };
    }
  };

  const header = getOutcomeHeader();
  const OutcomeIcon = header.icon;

  return (
    <>
      <div 
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 animate-fade-in"
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Media Origin & Provenance
              </h2>
              <span className="text-[10px] bg-white/10 text-[var(--text-tertiary)] px-2 py-0.5 rounded-full font-mono">
                v{policyVersion || '2026.2'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Outcome Hero Banner */}
          <div className="p-5 border-b border-[var(--border)] bg-black/20">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-2xl border ${header.badgeColor} shrink-0`}>
                <OutcomeIcon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">
                    {header.title}
                  </h3>
                  {publicationDecision && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      publicationDecision === 'ALLOWED' ? 'bg-emerald-500/20 text-emerald-300' :
                      publicationDecision === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {publicationDecision === 'ALLOWED' ? 'APPROVED FOR PUBLISHING' :
                       publicationDecision === 'BLOCKED' ? 'PUBLICATION BLOCKED' :
                       'HELD FOR REVIEW'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {decisionReason || header.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border)] px-4 bg-[var(--surface-color)] gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'summary', label: 'Overview' },
              { id: 'google', label: 'Google AI / SynthID' },
              { id: 'provenance', label: 'C2PA Credentials' },
              { id: 'metadata', label: 'Metadata (EXIF)' },
              { id: 'detector', label: 'Pixel Model' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-xs font-semibold py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id 
                    ? 'border-[var(--ig-primary-button)] text-[var(--text-primary)]' 
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-2">Key Findings</h4>
                  <ul className="space-y-1.5">
                    {evidence?.detailedPoints?.length > 0 ? (
                      evidence.detailedPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2 text-[var(--text-secondary)]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{pt}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-[var(--text-tertiary)] italic">No detailed points recorded.</li>
                    )}
                  </ul>
                </div>

                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {mediaUrl && (
                      <img 
                        src={mediaUrl} 
                        alt="Preview" 
                        className="w-12 h-12 object-cover rounded-lg border border-white/10"
                      />
                    )}
                    <div>
                      <div className="font-mono text-[11px] text-[var(--text-primary)] font-bold truncate max-w-[280px]">
                        Media ID: {mediaId}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">
                        Analyzed unaltered source bytes
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    Transparency & Limitations
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-[var(--text-tertiary)] text-[11px]">
                    {evidence?.limitations?.length > 0 ? (
                      evidence.limitations.map((lim, i) => (
                        <li key={i}>{lim}</li>
                      ))
                    ) : (
                      <li>Automated checks provide probabilistic evidence synthesis.</li>
                    )}
                    <li>Private fields (GPS coordinates, device serial numbers) have been strictly redacted.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* GOOGLE AI TAB */}
            {activeTab === 'google' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">SynthID Watermark Verification</span>
                    <span className={`font-mono font-bold ${
                      googleAiDetection?.watermarkDetected ? 'text-rose-400' :
                      googleAiDetection?.status === 'COMPLETED' ? 'text-emerald-400' :
                      'text-amber-400'
                    }`}>
                      {googleAiDetection?.watermarkDetected ? 'DETECTED' :
                       googleAiDetection?.status === 'COMPLETED' ? 'NOT DETECTED' :
                       googleAiDetection?.status || 'NOT CONFIGURED'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Provider</span>
                    <span className="text-[var(--text-primary)]">{googleAiDetection?.provider || 'Google Cloud SynthID API'}</span>
                  </div>
                  {googleAiDetection?.errorMessage && (
                    <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      {googleAiDetection.errorMessage}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Google C2PA Origin Claim</span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {provenance?.isGoogleAiOriginAsserted ? 'Google AI Generated' :
                       provenance?.isGoogleAiEditingAsserted ? 'Google AI Edited' : 'None'}
                    </span>
                  </div>
                  {provenance?.googleToolsMentioned?.length > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-tertiary)]">Identified Google Tools</span>
                      <span className="text-amber-300 font-semibold">{provenance.googleToolsMentioned.join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* C2PA CREDENTIALS TAB */}
            {activeTab === 'provenance' && (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Manifest Status</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{provenance?.status || 'ABSENT'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Signer / Issuer</span>
                    <span className="text-[var(--text-primary)]">{provenance?.signerName || provenance?.issuer || 'Unsigned'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">AI Origin Asserted</span>
                    <span className={provenance?.isAiOriginAsserted ? 'text-rose-400 font-bold' : 'text-[var(--text-tertiary)]'}>
                      {provenance?.isAiOriginAsserted ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Camera Hardware Verified</span>
                    <span className={provenance?.isCameraCaptureAsserted ? 'text-emerald-400 font-bold' : 'text-[var(--text-tertiary)]'}>
                      {provenance?.isCameraCaptureAsserted ? 'YES' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* METADATA TAB */}
            {activeTab === 'metadata' && (
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-tertiary)]">Camera Make & Model</span>
                  <span className="text-[var(--text-primary)]">
                    {metadata?.cameraMake || metadata?.cameraModel ? `${metadata.cameraMake || ''} ${metadata.cameraModel || ''}` : 'No Camera EXIF'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-tertiary)]">Software Tag</span>
                  <span className="text-[var(--text-primary)]">{metadata?.software || 'None'}</span>
                </div>
                {metadata?.aiGenerationSoftwareDetected && (
                  <div className="flex items-center justify-between text-amber-300 font-semibold">
                    <span>Generative Signature</span>
                    <span>{metadata.aiGenerationSoftwareDetected}</span>
                  </div>
                )}
              </div>
            )}

            {/* DETECTOR TAB */}
            {activeTab === 'detector' && (
              <div className="p-3.5 rounded-xl bg-black/30 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-tertiary)]">Detector Model</span>
                  <span className="text-[var(--text-primary)] font-mono">{diagnostics?.detector?.modelName || 'UniversalFakeDetect'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-tertiary)]">Detector Status</span>
                  <span className="text-[var(--text-primary)] font-bold">{diagnostics?.detector?.status || 'COMPLETED'}</span>
                </div>
                {diagnostics?.detector?.rawScore !== undefined && diagnostics?.detector?.rawScore !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-tertiary)]">Raw Score</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{diagnostics.detector.rawScore}</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-[var(--border)] bg-black/30 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisputeModal(true)}
              className="gap-1.5 text-xs"
            >
              <Flag className="w-3.5 h-3.5" />
              Request Review
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
          </div>
        </div>
      </div>

      {/* Review Dispute Modal */}
      {showDisputeModal && (
        <ReviewDisputeModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          mediaId={mediaId}
          onSuccess={() => {
            setShowDisputeModal(false);
            if (onReviewSubmitted) onReviewSubmitted();
          }}
        />
      )}
    </>
  );
}
