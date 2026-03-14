import Button from '../ui/Button';
import { formatCompactNumber } from '../../utils/formatters';

export default function CommunityHeader({ community }) {
    if (!community) return null;

    return (
        <div className="mb-8">
            {/* Banner */}
            <div className="w-full h-32 md:h-48 rounded-xl bg-brand-surface border border-white/5 overflow-hidden mb-4 relative">
                {community.bannerUrl ? (
                    <img src={community.bannerUrl} alt="Banner" className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-bg to-brand-surface opacity-80" />
                )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4">
                 <div className="flex items-end gap-4 -mt-12 relative z-10 w-full sm:w-auto">
                     {/* Icon */}
                     <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-brand-bg border-4 border-brand-bg flex items-center justify-center overflow-hidden shrink-0 shadow-2xl">
                         {community.iconUrl ? (
                             <img src={community.iconUrl} alt="Icon" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full bg-gradient-to-br from-brand-gold/60 to-brand-gold/20 flex items-center justify-center">
                                 <span className="font-playfair font-bold text-4xl text-white drop-shadow-lg">
                                     {community.name.charAt(0).toUpperCase()}
                                 </span>
                             </div>
                         )}
                     </div>

                     <div className="pb-1 sm:pb-2">
                         <h1 className="text-2xl md:text-3xl font-playfair font-bold text-white tracking-tight">{community.name}</h1>
                         <div className="text-sm font-mono text-brand-muted tracking-wide mt-1">h/{community.slug}</div>
                     </div>
                 </div>

                 <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto mt-2 sm:mt-0 pt-4 sm:pt-0 sm:ml-auto">
                      <div className="text-xs font-mono text-brand-muted uppercase sm:mb-2 text-center sm:text-right">
                          <span className="font-bold text-white text-base block">{formatCompactNumber(community.memberCount)}</span>
                          Members
                      </div>
                      <Button variant="secondary" className="px-8 shrink-0">Join Hub</Button>
                 </div>
            </div>

            <div className="mt-8 px-4 text-brand-text/90 font-jakarta max-w-3xl leading-relaxed">
                 {community.description}
            </div>
            
            <div className="mt-8 border-b border-white/10 flex gap-6 px-4">
                 <button className="text-brand-gold border-b-2 border-brand-gold pb-4 font-jakarta font-medium text-sm transition-colors">Hot Feed</button>
                 <button className="text-brand-muted hover:text-white pb-4 font-jakarta font-medium text-sm transition-colors">New</button>
                 <button className="text-brand-muted hover:text-white pb-4 font-jakarta font-medium text-sm transition-colors">Top</button>
            </div>
        </div>
    );
}
