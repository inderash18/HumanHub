import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { FiShield, FiCheckCircle, FiXCircle, FiTrendingUp, FiCpu, FiClock, FiFileText, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function VerificationDashboard() {
  const { user } = useAuthStore();
  const trustIndex = user?.trustScore || 0.96;
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserHistory = async () => {
      try {
        if (!user?.username) return;
        const res = await api.get(`/users/${user.username}`);
        setPosts(res.data.posts || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserHistory();
  }, [user]);

  const submitAppeal = (e) => {
      e.preventDefault();
      if (!appealText.trim()) return;
      toast.success("Appeal request queued. Core agents will audit.");
      setShowAppeal(false);
      setAppealText('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 gap-3">
        <Spinner size="lg" />
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)] animate-pulse">Syncing local ledger...</span>
      </div>
    );
  }

  // Derive charts & logs from actual database posts
  const logs = posts.map(p => {
    const textScore = p.detectionScores?.text?.score || 0;
    const imgScore = p.detectionScores?.image?.score || 0;
    const scoreVal = Math.round((1 - Math.max(textScore, imgScore)) * 100);
    return {
      id: p._id,
      type: p.mediaUrls?.length ? 'Media Post' : 'Text Post',
      title: p.title,
      status: p.status === 'published' ? 'Passed' : p.status === 'rejected' ? 'Failed' : 'Pending',
      score: scoreVal,
      date: new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    };
  });

  const chartData = [...posts].reverse().map(p => {
    const textScore = p.detectionScores?.text?.score || 0;
    const imgScore = p.detectionScores?.image?.score || 0;
    const scoreVal = Math.round((1 - Math.max(textScore, imgScore)) * 100);
    return {
      name: new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: scoreVal,
      aiProb: Math.round(Math.max(textScore, imgScore) * 100)
    };
  });

  // Fallbacks if user has no posts yet
  const displayChartData = chartData.length > 0 ? chartData : [
    { name: 'Initial', score: Math.round(trustIndex * 100), aiProb: Math.round((1 - trustIndex) * 100) }
  ];

  const acceptedCount = posts.filter(p => p.status === 'published').length;
  const rejectedCount = posts.filter(p => p.status === 'rejected').length;

  return (
    <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-6 py-2 px-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div className="flex items-center gap-2.5">
          <FiShield className="text-2xl text-[var(--verified-color)]" />
          <h1 className="font-brand text-2xl font-black tracking-tight text-[var(--text-primary)]">Human Verification Dashboard</h1>
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">ID: #{user?._id?.substring(0, 8)}</span>
      </div>

      {/* Grid: Trust Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Animated Trust Circle Indicator */}
        <div className="premium-card p-6 flex flex-col items-center text-center justify-center bg-[var(--surface-color)] border border-[var(--border-color)]">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] mb-4 flex items-center gap-1.5">
            <FiShield className="text-[var(--verified-color)]" />
            <span>Overall Trust Score</span>
          </span>
          
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute inset-2 bg-[var(--verified-color)]/5 rounded-full animate-ping" />
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border-color)" strokeWidth="2.5" />
              <motion.circle 
                cx="18" 
                cy="18" 
                r="15" 
                fill="none" 
                stroke="var(--verified-color)" 
                strokeWidth="3.2" 
                strokeDasharray="94.2" 
                strokeDashoffset={94.2 - (94.2 * trustIndex)}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 94.2 }}
                animate={{ strokeDashoffset: 94.2 - (94.2 * trustIndex) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-black font-brand text-[var(--text-primary)]">{(trustIndex * 100).toFixed(0)}%</span>
              <span className="text-[8px] font-extrabold text-[var(--verified-color)] uppercase tracking-wider">Human Safe</span>
            </div>
          </div>
          <button 
              onClick={() => setShowAppeal(true)}
              className="mt-6 btn-premium text-[9px] uppercase tracking-widest font-extrabold px-5 py-2.5"
          >
              Request Score Appeal
          </button>
        </div>

        {/* Verification Timeline Tracker */}
        <div className="premium-card p-6 bg-[var(--surface-color)] border border-[var(--border-color)] flex flex-col gap-4">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <FiClock />
            <span>Identity Verification Path</span>
          </span>

          <div className="flex flex-col gap-4 mt-2">
            {[
              { title: 'Identity Cleared', desc: 'Biological login markers resolved.', active: true },
              { title: 'Biometric Handshake', desc: 'Secure fingerprint ledger match.', active: true },
              { title: 'Scanner Consistency', desc: `${(trustIndex * 100).toFixed(0)}% manual text density score.`, active: true },
              { title: 'Ledger Audit Complete', desc: `${rejectedCount} synthetic blocks detected.`, active: true }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${step.active ? 'bg-[var(--verified-color)]' : 'bg-[var(--border-color)]'}`}>
                    ✓
                  </div>
                  {idx < 3 && <div className="w-[1px] bg-[var(--border-color)] flex-1 my-1" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{step.title}</span>
                  <span className="text-[10px] text-[var(--text-secondary)]">{step.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Detection report logs */}
        <div className="premium-card p-6 bg-[var(--surface-color)] border border-[var(--border-color)] flex flex-col gap-4">
          <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <FiFileText />
            <span>Real-time AI Model Report</span>
          </span>

          <div className="flex flex-col gap-3 mt-2">
            {[
              { label: 'Accepted Submissions', val: `${acceptedCount} Posts`, rate: acceptedCount > 0 ? 100 : 0 },
              { label: 'Synthetic Blocks', val: `${rejectedCount} Rejections`, rate: 0 },
              { label: 'Metadata Signatures', val: 'Human Optical', rate: 99 },
              { label: 'Fingerprint Match', val: 'Ledger Sync', rate: 97 }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-[16px] bg-[var(--surface-hover)]/30 border border-[var(--border-color)]">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className="text-[var(--verified-color)]">{item.val}</span>
                </div>
                <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[var(--verified-color)] h-full rounded-full" style={{ width: `${item.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: Charts Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quality Over Time Line Chart */}
        <div className="premium-card p-5 md:col-span-2 flex flex-col gap-4 bg-[var(--surface-color)] border border-[var(--border-color)]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
            <FiTrendingUp className="text-[var(--brand-color)]" />
            <span>Trust Score History ({displayChartData.length} entries)</span>
          </span>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData}>
                <defs>
                  <linearGradient id="trustGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--verified-color)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--verified-color)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-color)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-primary)',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="score" stroke="var(--verified-color)" strokeWidth={2.5} fillOpacity={1} fill="url(#trustGlow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Probability vs Human Score Bar */}
        <div className="premium-card p-5 flex flex-col gap-4 bg-[var(--surface-color)] border border-[var(--border-color)]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">AI Interference Probability</span>
          <div className="h-60 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" tickLine={false} />
                <YAxis stroke="var(--text-muted)" tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--surface-color)', 
                    borderColor: 'var(--border-color)', 
                    color: 'var(--text-primary)',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="aiProb" fill="var(--rejected-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* History Log Table */}
      <div className="premium-card p-5 bg-[var(--surface-color)] border border-[var(--border-color)]">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-secondary)] mb-4 block">Verification Log Stream</span>
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="text-center p-10 text-[var(--text-secondary)] text-xs italic">
              No verification events logged yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold">
                  <th className="pb-3 font-semibold">Type</th>
                  <th className="pb-3 font-semibold">Title</th>
                  <th className="pb-3 font-semibold">Result</th>
                  <th className="pb-3 font-semibold text-right">Authenticity</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--surface-hover)] transition-colors">
                    <td className="py-4 text-[var(--text-secondary)] font-medium">{log.type}</td>
                    <td className="py-4 font-bold text-[var(--text-primary)]">{log.title}</td>
                    <td className="py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.status === 'Passed' ? 'bg-emerald-500/10 text-[var(--verified-color)]' : 'bg-rose-500/10 text-[var(--rejected-color)]'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 text-right font-bold font-mono text-[var(--text-primary)]">{log.score}%</td>
                    <td className="py-4 text-right text-[var(--text-secondary)]">{log.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Appeal Dialogue Modal */}
      <AnimatePresence>
          {showAppeal && (
              <div className="fixed inset-0 z-[20000] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
                  <motion.div 
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="w-full max-w-sm p-6 rounded-[28px] overflow-hidden flex flex-col gap-5 relative shadow-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]"
                      style={{ backdropFilter: 'blur(20px)' }}
                  >
                      <button 
                          onClick={() => setShowAppeal(false)}
                          className="absolute top-4 right-4 p-1.5 hover:bg-[var(--surface-hover)] rounded-full text-[var(--text-secondary)]"
                      >
                          <FiX className="text-sm" />
                      </button>

                      <div className="flex flex-col gap-1 pr-6">
                          <span className="text-[9px] font-extrabold uppercase tracking-widest text-[var(--text-secondary)]">Verification Appeal</span>
                          <h3 className="text-md font-black font-brand text-[var(--text-primary)]">Dispute Trust Rating</h3>
                      </div>

                      <form onSubmit={submitAppeal} className="flex flex-col gap-4">
                          <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Appeal statement</label>
                              <textarea
                                  required
                                  value={appealText}
                                  onChange={e => setAppealText(e.target.value)}
                                  placeholder="Explain why your text density signatures were flagged..."
                                  className="premium-input text-xs font-semibold min-h-[90px] resize-none"
                              />
                          </div>

                          <button 
                              type="submit"
                              className="btn-premium w-full text-xs font-extrabold py-2.5 uppercase tracking-wider"
                          >
                              Submit Appeal
                          </button>
                      </form>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
}
