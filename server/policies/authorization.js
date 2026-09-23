/**
 * Centralized Authorization Policy Engine (OWASP ASVS V4.1 BOLA Defenses)
 * 
 * Implements server-side ABAC/RBAC authorization matrices for all sensitive social actions.
 */

function getId(obj) {
  if (!obj) return null;
  if (typeof obj === 'string') return obj;
  if (obj._id) return String(obj._id);
  return String(obj);
}

/**
 * Check if a user can view a specific post.
 */
export function canViewPost({ user, post, isFollowing = false, isBlocked = false }) {
  if (!post) return false;

  const userId = getId(user);
  const authorId = getId(post.author);
  const isPrivileged = user && ['admin', 'moderator'].includes(user.role);
  const isAuthor = Boolean(userId && authorId && userId === authorId);

  // Blocked post status: only moderators/admins
  if (post.status === 'blocked') {
    return isPrivileged;
  }

  // Pending review post status: author or moderators/admins
  if (post.status === 'pending_review') {
    return isAuthor || isPrivileged;
  }

  // Active bidirectional block between viewer and author
  if (isBlocked && !isPrivileged) {
    return false;
  }

  // Private account check
  const authorPrivacy = post.author?.privacySettings || {};
  if (authorPrivacy.isPrivate) {
    if (isAuthor || isFollowing || isPrivileged) {
      return true;
    }
    return false;
  }

  // Published public post
  return post.status === 'published';
}

/**
 * Check if a user can edit a post.
 */
export function canEditPost({ user, post }) {
  if (!user || !post || user.isBanned) return false;
  const userId = getId(user);
  const authorId = getId(post.author);
  return Boolean(userId && authorId && userId === authorId);
}

/**
 * Check if a user can delete a post.
 */
export function canDeletePost({ user, post }) {
  if (!user || !post || user.isBanned) return false;
  const userId = getId(user);
  const authorId = getId(post.author);
  const isAuthor = Boolean(userId && authorId && userId === authorId);
  const isPrivileged = ['admin', 'moderator'].includes(user.role);
  return isAuthor || isPrivileged;
}

/**
 * Check if a user can view a media file.
 */
export function canViewMedia({ user, media, post, isFollowing = false, isBlocked = false }) {
  if (!media) return false;

  const userId = getId(user);
  const ownerId = getId(media.owner);
  const isPrivileged = user && ['admin', 'moderator'].includes(user.role);
  const isOwner = Boolean(userId && ownerId && userId === ownerId);

  if (isOwner || isPrivileged) return true;

  if (post) {
    return canViewPost({ user, post, isFollowing, isBlocked });
  }

  // Unattached or quarantined media
  return false;
}

/**
 * Check if a user can comment on a post.
 */
export function canComment({ user, post, isFollowing = false, isBlocked = false }) {
  if (!user || !post || user.isBanned || !user.emailVerified) return false;
  if (isBlocked) return false;
  return canViewPost({ user, post, isFollowing, isBlocked });
}

/**
 * Check if a user can follow another user.
 */
export function canFollow({ user, targetUser, isBlocked = false }) {
  if (!user || !targetUser || user.isBanned) return false;
  const userId = getId(user);
  const targetId = getId(targetUser);
  if (userId === targetId) return false;
  if (isBlocked) return false;
  return true;
}

/**
 * Check if a user can send a direct message to a recipient.
 */
export function canMessage({ user, recipientUser, isFollowing = false, isBlocked = false }) {
  if (!user || !recipientUser || user.isBanned || !user.emailVerified) return false;
  const userId = getId(user);
  const recipientId = getId(recipientUser);
  if (userId === recipientId) return false;
  if (isBlocked) return false;

  const isPrivileged = ['admin', 'moderator'].includes(user.role);
  if (isPrivileged) return true;

  const recipientPrivacy = recipientUser.privacySettings || {};
  if (recipientPrivacy.allowDirectMessages === false && !isFollowing) {
    return false;
  }

  return true;
}

/**
 * Check if a user can view a conversation.
 */
export function canViewConversation({ user, conversation }) {
  if (!user || !conversation || user.isBanned) return false;
  const userId = getId(user);
  const isParticipant = (conversation.participants || []).some(p => getId(p) === userId);
  return isParticipant;
}

/**
 * Check if a user has moderation privileges.
 */
export function canModerate({ user }) {
  if (!user || user.isBanned) return false;
  return ['admin', 'moderator'].includes(user.role);
}

/**
 * Check if a user can manage an account.
 */
export function canManageAccount({ user, targetUser }) {
  if (!user || !targetUser || user.isBanned) return false;
  const userId = getId(user);
  const targetId = getId(targetUser);
  return userId === targetId || user.role === 'admin';
}

export default {
  canViewPost,
  canEditPost,
  canDeletePost,
  canViewMedia,
  canComment,
  canFollow,
  canMessage,
  canViewConversation,
  canModerate,
  canManageAccount
};
