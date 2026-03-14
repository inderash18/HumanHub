import { RiShieldCheckFill, RiErrorWarningFill, RiShieldStarLine } from 'react-icons/ri';
import Badge from '../ui/Badge';
import { scoreToPercentage } from '../../utils/formatters';

export default function VerificationBadge({ scores, status, showDetail = false }) {
    if (status === 'pending') {
        return (
            <Badge variant="default" className="gap-1 px-2 pr-3 py-1 bg-white/5 animate-pulse">
                <RiShieldStarLine className="text-brand-gold opacity-50" />
                <span className="text-white/60">Verifying...</span>
            </Badge>
        );
    }

    if (status === 'published') {
        return (
            <Badge variant="success" className="gap-1.5 px-2.5 py-1 bg-brand-success/10 border-brand-success/30">
                <RiShieldCheckFill className="text-brand-success text-sm" />
                <span className="text-white uppercase tracking-wider scale-90 origin-left">Verified Human</span>
            </Badge>
        );
    }

    if (status === 'rejected' || status === 'removed') {
        return (
            <Badge variant="danger" className="gap-1.5 px-2.5 py-1 bg-brand-danger/10 border-brand-danger/30">
                <RiErrorWarningFill className="text-brand-danger text-sm" />
                <span className="text-white uppercase tracking-wider scale-90 origin-left">Bot Flagged</span>
            </Badge>
        );
    }

    return null;
}
