/**
 * Turns a flat list of comments (adjacency list: each one points at its `parentId`) into a
 * nested thread, in O(n) with a lookup map instead of O(n²) nested scans.
 */
import type { CommentDocument } from '../../db/collections.js';

export interface PublicComment {
  id: string;
  giftId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  text: string;
  sentiment: CommentDocument['sentiment'];
  createdAt: Date;
  replies: PublicComment[];
}

export function toPublicComment(doc: CommentDocument): PublicComment {
  return {
    id: doc._id.toHexString(),
    giftId: doc.giftId,
    parentId: doc.parentId?.toHexString() ?? null,
    authorId: doc.authorId,
    authorName: doc.authorName,
    text: doc.text,
    sentiment: doc.sentiment,
    createdAt: doc.createdAt,
    replies: [],
  };
}

/**
 * Builds the thread with oldest comments first at every level.
 * A reply whose parent is missing (e.g. deleted) is promoted to the top level
 * rather than silently dropped.
 */
export function buildCommentTree(docs: CommentDocument[]): PublicComment[] {
  const sorted = [...docs].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const byId = new Map<string, PublicComment>();
  for (const doc of sorted) byId.set(doc._id.toHexString(), toPublicComment(doc));

  const roots: PublicComment[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}
