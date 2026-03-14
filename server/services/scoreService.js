export const updateTrustScore = (user, adjustment) => {
  // Bound score between 0.0 and 1.0
  user.trustScore = Math.max(0, Math.min(1.0, user.trustScore + adjustment));
  return user.trustScore;
};
