export default function Spinner({ size = 'md', className = '' }) {
    const sizes = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    return (
        <div className={`relative ${sizes[size]} ${className}`}>
            <div className="absolute inset-0 rounded-full border-t-brand-gold border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
            <div className="absolute inset-0 rounded-full border-white/10"></div>
        </div>
    );
}
