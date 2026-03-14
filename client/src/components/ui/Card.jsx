export default function Card({ children, className = '', hover = false, noPadding = false }) {
    return (
        <div className={`glass rounded-xl overflow-hidden ${noPadding ? '' : 'p-6'} ${hover ? 'transition-all duration-300 hover:border-white/20 hover:-translate-y-1' : ''} ${className}`}>
            {children}
        </div>
    );
}
