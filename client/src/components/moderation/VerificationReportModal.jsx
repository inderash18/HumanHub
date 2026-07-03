import { motion } from 'framer-motion';
import { FiX, FiCheckCircle, FiShield, FiCpu, FiUser, FiInfo } from 'react-icons/fi';

export default function VerificationReportModal({ isOpen, onClose, post, authenticityScore }) {
  if (!isOpen || !post) return null;

  const detection = post.detectionScores || {};
  const textScore = detection.text?.score || 0.1;
  const imageScore = detection.image?.score || 0.2;
  const botScore = detection.bot?.score || 0.1;
  const integrityScore = 1 - Math.max(textScore, imageScore, botScore);

  const steps = [
    { label: 'Upload', desc: 'Content submitted', status: 'completed' },
    { label: 'Scanning', desc: 'Synthetics analysis', status: 'completed' },
    { label: 'Analysis', desc: 'Confidence calculations', status: 'completed' },
    { label: 'Verdict', desc: authenticityScore >= 60 ? 'Human Verified' : 'AI Flagged', status: 'completed' },
    { label: 'Published', desc: 'Social distribution', status: 'completed' }
  ];

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-lg bg-[var(--surface-color)] border border-[var(--border-color)] rounded-[24px] overflow-hidden shadow-2xl flex flex-col justify-between"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <FiShield className="text-xl text-[var(--verified-color)]" />
            <h3 className="font-brand font-bold text-md text-[var(--text-primary)]">AI Verification Report</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Scrollable Report Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] flex flex-col gap-6 no-scrollbar">
          {/* Main Authenticity score ring */}
          <div className="flex items-center gap-5 bg-[var(--surface-hover)] p-5 rounded-[18px] border border-[var(--border-color)]">
            <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
              {/* Simple Circular SVG progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                <circle 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="none" 
                  stroke={authenticityScore >= 60 ? 'var(--verified-color)' : authenticityScore >= 40 ? 'var(--warning-color)' : 'var(--rejected-color)'} 
                  strokeWidth="3" 
                  strokeDasharray="100" 
                  strokeDashoffset={100 - authenticityScore}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-extrabold text-[var(--text-primary)] font-mono">{authenticityScore}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--text-primary)] font-brand">
                {authenticityScore >= 60 ? 'Human Verified' : authenticityScore >= 40 ? 'Flagged for Review' : 'Rejected Synthetics'}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                The content matches human generation criteria with a confidence score of {(integrityScore * 100).toFixed(0)}%.
              </span>
            </div>
          </div>

          {/* Verification Timeline */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Verification Timeline</span>
            <div className="flex justify-between items-start relative pl-2 pr-2">
              {/* Connecting line */}
              <div className="absolute top-3 left-4 right-4 h-[1px] bg-[var(--border-color)] z-0" />
              {steps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center text-center gap-1.5 z-10 relative">
                  <div className="w-6 h-6 rounded-full bg-[var(--surface-color)] border-2 border-[var(--verified-color)] flex items-center justify-center text-[10px] text-[var(--verified-color)] shadow-sm">
                    ✓
                  </div>
                  <span className="text-[9px] font-bold text-[var(--text-primary)]">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scanner breakdown values */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Scanners Analysis</span>
            <div className="grid grid-cols-2 gap-3.5">
              {/* Text analysis */}
              <div className="p-3 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[14px]">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-bold">
                  <FiCpu />
                  <span>Text Perplexity</span>
                </div>
                <div className="text-md font-bold font-mono mt-1.5 text-[var(--text-primary)]">
                  {((1 - textScore) * 100).toFixed(0)}% <span className="text-[9px] text-[var(--text-secondary)] font-sans">Human</span>
                </div>
              </div>

              {/* Image analysis */}
              <div className="p-3 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[14px]">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-bold">
                  <FiCpu />
                  <span>Image Metadata</span>
                </div>
                <div className="text-md font-bold font-mono mt-1.5 text-[var(--text-primary)]">
                  {((1 - imageScore) * 100).toFixed(0)}% <span className="text-[9px] text-[var(--text-secondary)] font-sans">Human</span>
                </div>
              </div>

              {/* Behavior Analysis */}
              <div className="p-3 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[14px]">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-bold">
                  <FiUser />
                  <span>Behavior Engine</span>
                </div>
                <div className="text-md font-bold font-mono mt-1.5 text-[var(--text-primary)]">
                  {((1 - botScore) * 100).toFixed(0)}% <span className="text-[9px] text-[var(--text-secondary)] font-sans">Human</span>
                </div>
              </div>

              {/* Deepfake classifier */}
              <div className="p-3 bg-[var(--surface-hover)] border border-[var(--border-color)] rounded-[14px]">
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)] font-bold">
                  <FiInfo />
                  <span>Trust Verdict</span>
                </div>
                <div className="text-md font-bold font-mono mt-1.5 text-[var(--text-primary)]">
                  {authenticityScore >= 60 ? 'Publish' : authenticityScore >= 40 ? 'Review' : 'Reject'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] flex gap-2 justify-end">
          <button 
            onClick={onClose}
            className="btn-premium py-2 px-6 text-xs"
          >
            Close Report
          </button>
        </div>
      </motion.div>
    </div>
  );
}
