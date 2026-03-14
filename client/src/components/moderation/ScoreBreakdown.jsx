import Badge from '../ui/Badge';
import { scoreToPercentage } from '../../utils/formatters';

export default function ScoreBreakdown({ scores }) {
    if (!scores) return null;

    const renderBar = (label, scoreObj, threshold) => {
        const pct = scoreToPercentage(scoreObj?.score);
        const warning = scoreObj?.score > threshold;

        return (
             <div className="mb-4">
                 <div className="flex justify-between items-center text-xs font-mono mb-1">
                     <span className={warning ? 'text-brand-danger font-bold uppercase tracking-wider' : 'text-brand-muted uppercase tracking-wider'}>{label}</span>
                     <span className={warning ? 'text-brand-danger' : 'text-brand-success'}>{pct}</span>
                 </div>
                 <div className="w-full bg-black rounded-full h-1.5 overflow-hidden flex">
                     <div 
                         className={`h-full transition-all duration-1000 ${warning ? 'bg-brand-danger' : 'bg-brand-success'}`}
                         style={{ width: pct }}
                     ></div>
                 </div>
                 {warning && <div className="mt-1 text-[10px] text-brand-danger/70 leading-tight">Threshold breached ({threshold*100}% max)</div>}
             </div>
        );
    };

    return (
        <div className="bg-brand-bg rounded-lg p-4 border border-white/5 h-full">
            <h5 className="font-playfair text-brand-gold text-lg mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
                <span>AI Pipeline Scan</span>
                <Badge variant={scores.text?.score > 0.85 ? 'danger' : 'success'}>Results</Badge>
            </h5>
            
            {renderBar('Semantic LLM Detect', scores.text, 0.85)}
            {renderBar('Generative Noise Map', scores.image, 0.80)}
            {renderBar('Bot Trajectory Graph', scores.bot, 0.75)}

            <div className="mt-6 pt-4 border-t border-white/5 text-[10px] font-mono text-brand-muted opacity-50 text-center leading-relaxed">
                Scan ID: {Math.random().toString(36).substring(7).toUpperCase()}-{(new Date()).getTime()}
            </div>
        </div>
    );
}
