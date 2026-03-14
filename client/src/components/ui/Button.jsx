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
    const baseStyles = 'inline-flex items-center justify-center font-jakarta font-medium transition-all rounded-lg outline-none whitespace-nowrap active:scale-95';
    
    const variants = {
        primary: 'bg-brand-gold text-brand-bg hover:bg-[#d4b55a] shadow-[0_0_15px_rgba(201,168,76,0.3)] hover:shadow-[0_0_20px_rgba(201,168,76,0.5)] disabled:bg-brand-gold/50 disabled:shadow-none',
        secondary: 'bg-brand-surface text-brand-text border border-white/10 hover:border-brand-gold/50 hover:bg-white/5 disabled:opacity-50',
        ghost: 'text-brand-muted hover:text-white hover:bg-white/5 bg-transparent',
        danger: 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20 hover:bg-brand-danger hover:text-white',
    };

    const sizes = {
        sm: 'text-xs px-3 py-1.5',
        md: 'text-sm px-4 py-2',
        lg: 'text-base px-6 py-3',
    };

    return (
        <motion.button
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
        >
            {children}
        </motion.button>
    );
}
