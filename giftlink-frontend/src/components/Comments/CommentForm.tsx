/**
 * Form to post a comment or a reply (spec 006, user story 2).
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';

import { ApiError, api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import type { Comment } from '../../types';

export const MAX_COMMENT_LENGTH = 500;

interface Props {
  giftId: string;
  parentId?: string;
  onPosted: (comment: Comment) => void;
  onCancel?: () => void;
  /** Move keyboard focus into the textarea when the form opens (reply forms). */
  focusOnMount?: boolean;
}

export default function CommentForm({ giftId, parentId, onPosted, onCancel, focusOnMount }: Props) {
  const { token, logout } = useAuth();
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputId = useId();
  const isReply = parentId !== undefined;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusOnMount) textareaRef.current?.focus();
  }, [focusOnMount]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !token) return;

    setSubmitting(true);
    setError(null);
    try {
      const comment = await api.postComment(giftId, { text: trimmed, parentId }, token);
      setText('');
      onPosted(comment);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        logout();
        setError('Your session has expired. Please log in again.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not post your comment.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form onSubmit={(e) => void handleSubmit(e)} className="mb-3">
      <Form.Label htmlFor={inputId} className={isReply ? 'visually-hidden' : undefined}>
        {isReply ? 'Your reply' : 'Add a comment'}
      </Form.Label>
      <Form.Control
        id={inputId}
        as="textarea"
        rows={isReply ? 2 : 3}
        value={text}
        maxLength={MAX_COMMENT_LENGTH}
        onChange={(e) => setText(e.target.value)}
        placeholder={isReply ? 'Write a reply…' : 'Ask a question or say thanks…'}
        ref={textareaRef}
      />
      <div className="d-flex align-items-center justify-content-between mt-2">
        <small className="text-muted">
          {text.length}/{MAX_COMMENT_LENGTH}
        </small>
        <div className="d-flex gap-2">
          {onCancel && (
            <Button variant="link" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={submitting || text.trim() === ''}>
            {submitting ? 'Posting…' : isReply ? 'Reply' : 'Post comment'}
          </Button>
        </div>
      </div>
      {error && (
        <Alert variant="danger" className="mt-2 mb-0 py-2">
          {error}
        </Alert>
      )}
    </Form>
  );
}
