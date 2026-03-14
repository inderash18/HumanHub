import CommunityCard from './CommunityCard';

export default function CommunityList({ communities = [], title = "" }) {
    if (!communities || communities.length === 0) return null;

    return (
        <div className="py-4">
            {title && <h2 className="text-xl font-playfair font-medium text-white mb-6 pl-2 border-l-2 border-brand-gold/50">{title}</h2>}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {communities.map(community => (
                     <CommunityCard key={community._id || community.slug} community={community} />
                 ))}
            </div>
        </div>
    );
}
