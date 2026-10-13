import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';

import type { CommentDocument } from '../../src/db/collections.js';
import { buildCommentTree } from '../../src/modules/comments/comment-tree.js';

let clock = 0;
function comment(text: string, parent: CommentDocument | null = null): CommentDocument {
  clock += 1;
  return {
    _id: new ObjectId(),
    giftId: 'g1',
    parentId: parent?._id ?? null,
    authorId: 'u1',
    authorName: 'Ana Lee',
    text,
    sentiment: null,
    createdAt: new Date(clock * 1000),
  };
}

describe('buildCommentTree', () => {
  it('returns an empty array for no comments', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('nests replies under their parents at any depth, oldest first', () => {
    const a = comment('A');
    const b = comment('B');
    const a1 = comment('A1', a);
    const a1x = comment('A1x', a1);
    const a2 = comment('A2', a);

    // Shuffled input order must not matter.
    const tree = buildCommentTree([a2, b, a1x, a, a1]);

    expect(tree.map((c) => c.text)).toEqual(['A', 'B']);
    expect(tree[0]!.replies.map((c) => c.text)).toEqual(['A1', 'A2']);
    expect(tree[0]!.replies[0]!.replies.map((c) => c.text)).toEqual(['A1x']);
    expect(tree[0]!.replies[0]!.parentId).toBe(a._id.toHexString());
  });

  it('promotes orphaned replies to the top level instead of dropping them', () => {
    const ghostParent = comment('deleted');
    const orphan = comment('orphan', ghostParent);

    expect(buildCommentTree([orphan]).map((c) => c.text)).toEqual(['orphan']);
  });

  it('maps documents to the public shape (string ids, no _id)', () => {
    const [node] = buildCommentTree([comment('hello')]);
    expect(node).toMatchObject({
      id: expect.stringMatching(/^[0-9a-f]{24}$/),
      parentId: null,
      replies: [],
    });
    expect(node).not.toHaveProperty('_id');
  });
});
