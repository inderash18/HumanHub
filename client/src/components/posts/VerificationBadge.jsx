export default function VerificationBadge({ scores, status }) {
    const isFlagged = status === 'flagged' || status === 'removed';
    const isReviewing = status === 'under_review';
    const aiScore = scores?.text?.score || scores?.combined || 0;
    const isHighRisk = aiScore > 0.7;

    const commonStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 700,
        letterSpacing: '0.2px'
    };

    if (isFlagged) {
        return (
            <span style={{
                ...commonStyle,
                background: 'rgba(255, 69, 0, 0.12)',
                border: '1px solid rgba(255, 69, 0, 0.2)',
                color: '#ff4500'
            }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.41L13.41 11l3.18 3.17c.39.39.39 1.03 0 1.42s-1.03.39-1.42 0L12 12.41l-3.17 3.18c-.39.39-1.03.39-1.42 0s-.39-1.03 0-1.42L10.59 11 7.41 7.82c-.39-.39-.39-1.03 0-1.42s1.03-.39 1.42 0L12 9.59l3.17-3.18c.39-.39 1.03-.39 1.42 0s.39 1.03 0 1.42z"/></svg>
                AI Flagged
            </span>
        );
    }

    if (isReviewing || isHighRisk) {
        return (
            <span style={{
                ...commonStyle,
                background: 'rgba(249, 168, 37, 0.12)',
                border: '1px solid rgba(249, 168, 37, 0.2)',
                color: '#f9a825'
            }}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                Analyzing
            </span>
        );
    }

    return (
        <span style={{
            ...commonStyle,
            background: 'rgba(0, 255, 127, 0.08)',
            border: '1px solid rgba(0, 255, 127, 0.15)',
            color: '#00ff7f'
        }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            Human
        </span>
    );
}
