import { motion } from 'framer-motion';

export default function Button({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    className = '', 
    onClick, 
    disabled,
    type = 'button'
}) {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all rounded-[16px] outline-none whitespace-nowrap active:scale-95 border cursor-pointer';
    
    const variants = {
        primary: 'bg-[var(--brand-color)] text-white hover:bg-[var(--brand-hover)] border-transparent disabled:opacity-50',
        secondary: 'bg-transparent text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--surface-hover)] disabled:opacity-50',
        ghost: 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] bg-transparent border-transparent',
        danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white',
    };

    const sizes = {
        sm: 'text-xs px-4 py-2',
        md: 'text-sm px-5 py-2.5',
        lg: 'text-base px-6 py-3.5',
    };

    return (
        <motion.button
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
        >
            {children}
        </motion.button>
    );
}
