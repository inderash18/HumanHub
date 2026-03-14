export default function Badge({ children, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-white/10 text-brand-text border border-white/5',
        success: 'bg-brand-success/10 text-brand-success border border-brand-success/20',
        danger: 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20',
        gold: 'bg-brand-gold-dim text-brand-gold border border-brand-gold/30',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
