/**
 * Comments for a gift (spec 006): replaces the course's hardcoded comments with
 * persisted, threaded ones.
 */
import { useCallback } from 'react';
import { Link, useLocation } from 'react-router';

import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useFetch } from '../../hooks/useFetch';
import type { Comment } from '../../types';
import ErrorAlert from '../common/ErrorAlert';
import Loading from '../common/Loading';

import CommentForm from './CommentForm';
import CommentItem from './CommentItem';
import './Comments.css';

/** Total number of comments including nested replies. */
function countComments(comments: Comment[]): number {
  return comments.reduce((sum, c) => sum + 1 + countComments(c.replies), 0);
}

export default function CommentsSection({ giftId }: { giftId: string }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const fetchComments = useCallback(
    (signal: AbortSignal) => api.getComments(giftId, signal),
    [giftId],
  );
  const { data: comments, error, loading, reload } = useFetch(fetchComments);

  return (
    <section className="comments-section mt-4" aria-labelledby="comments-title">
      <h2 id="comments-title" className="h4 mb-3">
        Comments{' '}
        {comments && comments.length > 0 && (
          <small className="text-muted">({countComments(comments)})</small>
        )}
      </h2>

      {isAuthenticated ? (
        <CommentForm giftId={giftId} onPosted={reload} />
      ) : (
        <p>
          <Link to="/app/login" state={{ from: location.pathname }}>
            Log in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      {loading && !comments && <Loading label="Loading comments…" />}
      {error && <ErrorAlert message={error.message} onRetry={reload} />}
      {comments?.length === 0 && <p className="text-muted">No comments yet. Be the first!</p>}
      {comments && comments.length > 0 && (
        <ul className="list-unstyled" aria-label="Comment thread">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} onPosted={reload} />
          ))}
        </ul>
      )}
    </section>
  );
}
