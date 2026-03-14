import { RiUser3Line } from 'react-icons/ri';

export default function Avatar({ src, size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    };

    return (
        <div className={`${sizes[size]} rounded-full bg-brand-surface border border-white/10 flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
            {src ? (
                <img src={src} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
                <RiUser3Line className="text-brand-muted w-1/2 h-1/2" />
            )}
        </div>
    );
}
