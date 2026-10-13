/**
 * One comment with its nested replies (rendered recursively).
 * Text is rendered as a React text node, so any HTML in it is escaped (no XSS).
 */
import { useState } from 'react';
import { Button } from 'react-bootstrap';

import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../lib/format';
import type { Comment } from '../../types';

import CommentForm from './CommentForm';
import SentimentBadge from './SentimentBadge';

interface Props {
  comment: Comment;
  onPosted: () => void;
}

export default function CommentItem({ comment, onPosted }: Props) {
  const { isAuthenticated } = useAuth();
  const [replying, setReplying] = useState(false);

  return (
    <li className="comment">
      <article className="card mb-2" aria-label={`Comment by ${comment.authorName}`}>
        <div className="card-body py-2">
          <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
            <strong className="comment-author">{comment.authorName}</strong>
            <time className="text-muted small" dateTime={comment.createdAt}>
              {timeAgo(comment.createdAt)}
            </time>
            <SentimentBadge sentiment={comment.sentiment} />
          </div>
          <p className="comment-text mb-1">{comment.text}</p>
          {isAuthenticated && !replying && (
            <Button
              variant="link"
              size="sm"
              className="p-0"
              onClick={() => setReplying(true)}
              aria-label={`Reply to ${comment.authorName}`}
            >
              Reply
            </Button>
          )}
          {replying && (
            <CommentForm
              giftId={comment.giftId}
              parentId={comment.id}
              focusOnMount
              onCancel={() => setReplying(false)}
              onPosted={() => {
                setReplying(false);
                onPosted();
              }}
            />
          )}
        </div>
      </article>
      {comment.replies.length > 0 && (
        <ul
          className="comment-replies list-unstyled"
          aria-label={`Replies to ${comment.authorName}`}
        >
          {comment.replies.map((reply) => (
            <CommentItem key={reply.id} comment={reply} onPosted={onPosted} />
          ))}
        </ul>
      )}
    </li>
  );
}
