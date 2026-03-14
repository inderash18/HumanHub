export default function VerificationBadge({ scores, status }) {
    // Determine if flagged
    const isFlagged = status === 'flagged' || status === 'removed';
    const isReviewing = status === 'under_review';
    const aiScore = scores?.text?.score || scores?.combined || 0;
    const isHighRisk = aiScore > 0.7;

    if (isFlagged) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '1px 6px', borderRadius: '10px',
                background: '#fff0ed', border: '1px solid #ff4500',
                color: '#ff4500', fontSize: '11px', fontWeight: 700
            }}>
                🚫 Flagged
            </span>
        );
    }

    if (isReviewing || isHighRisk) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                padding: '1px 6px', borderRadius: '10px',
                background: '#fff8e1', border: '1px solid #f9a825',
                color: '#e65100', fontSize: '11px', fontWeight: 700
            }}>
                🔍 Under Review
            </span>
        );
    }

    return (
        <span className="human-badge">
            ✅ Human
        </span>
    );
}
