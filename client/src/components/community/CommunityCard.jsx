import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatCompactNumber } from '../../utils/formatters';

export default function CommunityCard({ community }) {
    if (!community) return null;

    return (
        <Card hover className="flex flex-col h-full bg-brand-surface border border-white/5">
            <Link to={`/c/${community.slug}`} className="flex items-start gap-4 mb-4 group">
                 {/* Icon */}
                 <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-gold/40 to-brand-gold/10 border border-brand-gold/20 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                     {community.iconUrl ? (
                         <img src={community.iconUrl} alt={community.name} className="w-full h-full object-cover" />
                     ) : (
                         <span className="font-playfair font-bold text-brand-gold text-lg">{community.name.charAt(0).toUpperCase()}</span>
                     )}
                 </div>

                 <div className="flex-1 min-w-0">
                     <h3 className="font-playfair font-bold text-white text-lg truncate group-hover:text-brand-gold transition-colors">{community.name}</h3>
                     <div className="text-xs text-brand-muted font-mono tracking-wide">h/{community.slug}</div>
                 </div>
            </Link>

            <p className="text-sm font-jakarta text-brand-text/80 mb-6 flex-1 line-clamp-3">
                {community.description}
            </p>

            <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                <div className="text-xs font-mono text-brand-muted uppercase">
                    <span className="font-bold text-white">{formatCompactNumber(community.memberCount)}</span> Members
                </div>
                <Button size="sm" variant="secondary" className="scale-90 origin-right">Join</Button>
            </div>
        </Card>
    );
}
