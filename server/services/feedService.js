/**
 * Calculate Reddit HotScore logic.
 * (Upvotes - Downvotes + 1) / (AgeInHours + 2)^1.5
 */
export const calculateHotScore = (upvotes, downvotes, date) => {
    const ageInHours = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60);
    return (upvotes - downvotes + 1) / Math.pow(ageInHours + 2, 1.5);
};
