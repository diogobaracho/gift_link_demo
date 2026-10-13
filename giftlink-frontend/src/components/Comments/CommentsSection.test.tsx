import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { SESSION_KEY } from '../../context/AuthContext';
import { makeAuthResult, makeComment } from '../../test/fixtures';
import { renderWithProviders } from '../../test/render';
import { server } from '../../test/server';
import type { Comment } from '../../types';

import CommentsSection from './CommentsSection';

/** In-memory comments API so posting really changes what the next GET returns. */
function mockCommentsApi(initial: Comment[] = []) {
  const thread = [...initial];
  const posted: unknown[] = [];
  server.use(
    http.get('/api/gifts/:id/comments', () => HttpResponse.json(thread)),
    http.post('/api/gifts/:id/comments', async ({ request }) => {
      const body = (await request.json()) as { text: string; parentId?: string };
      posted.push(body);
      const comment = makeComment({
        text: body.text,
        authorName: 'Ana Lee',
        parentId: body.parentId ?? null,
      });
      const parent = thread.find((c) => c.id === body.parentId);
      if (parent) parent.replies.push(comment);
      else thread.push(comment);
      return HttpResponse.json(comment, { status: 201 });
    }),
  );
  return { posted };
}

describe('<CommentsSection />', () => {
  it('shows an empty state and a login prompt to anonymous users', async () => {
    mockCommentsApi();
    renderWithProviders(<CommentsSection giftId="gift-1" />, { route: '/app/product/gift-1' });

    expect(await screen.findByText('No comments yet. Be the first!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/app/login');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders the thread with nested replies, authors and sentiment', async () => {
    const reply = makeComment({ authorName: 'Ana Lee', text: 'Yes, still available' });
    mockCommentsApi([
      makeComment({
        authorName: 'Bob Ray',
        text: 'Is it available?',
        sentiment: { label: 'neutral', score: 0 },
        replies: [reply],
      }),
    ]);

    renderWithProviders(<CommentsSection giftId="gift-1" />);

    const bob = await screen.findByRole('article', { name: 'Comment by Bob Ray' });
    expect(within(bob).getByText('Is it available?')).toBeInTheDocument();
    expect(within(bob).getByText('neutral')).toBeInTheDocument();
    const replies = screen.getByRole('list', { name: 'Replies to Bob Ray' });
    expect(within(replies).getByText('Yes, still available')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Comments \(2\)/ })).toBeInTheDocument();
  });

  it('lets a logged-in user post a comment', async () => {
    const { posted } = mockCommentsApi();
    const { user } = renderWithProviders(<CommentsSection giftId="gift-1" />, {
      session: makeAuthResult(),
    });

    const box = await screen.findByLabelText('Add a comment');
    const submit = screen.getByRole('button', { name: 'Post comment' });
    expect(submit).toBeDisabled();

    await user.type(box, '  I would love this!  ');
    expect(screen.getByText('22/500')).toBeInTheDocument();
    await user.click(submit);

    expect(await screen.findByText('I would love this!')).toBeInTheDocument();
    expect(posted).toEqual([{ text: 'I would love this!' }]);
    expect(box).toHaveValue('');
  });

  it('replies to a comment', async () => {
    const parent = makeComment({ id: 'p1', authorName: 'Bob Ray', text: 'Anyone?' });
    const { posted } = mockCommentsApi([parent]);
    const { user } = renderWithProviders(<CommentsSection giftId="gift-1" />, {
      session: makeAuthResult(),
    });

    await user.click(await screen.findByRole('button', { name: 'Reply to Bob Ray' }));
    const replyBox = screen.getByLabelText('Your reply');
    expect(replyBox).toHaveFocus();
    await user.type(replyBox, 'Me!');
    await user.click(screen.getByRole('button', { name: 'Reply' }));

    const replies = await screen.findByRole('list', { name: 'Replies to Bob Ray' });
    expect(within(replies).getByText('Me!')).toBeInTheDocument();
    expect(posted).toEqual([{ text: 'Me!', parentId: 'p1' }]);
    expect(screen.queryByLabelText('Your reply')).not.toBeInTheDocument();
  });

  it('can cancel a reply', async () => {
    mockCommentsApi([makeComment({ authorName: 'Bob Ray' })]);
    const { user } = renderWithProviders(<CommentsSection giftId="gift-1" />, {
      session: makeAuthResult(),
    });

    await user.click(await screen.findByRole('button', { name: 'Reply to Bob Ray' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Your reply')).not.toBeInTheDocument();
  });

  it('logs the user out when the session expired server-side', async () => {
    server.use(
      http.get('/api/gifts/:id/comments', () => HttpResponse.json([])),
      http.post('/api/gifts/:id/comments', () =>
        HttpResponse.json(
          { error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } },
          { status: 401 },
        ),
      ),
    );
    const { user } = renderWithProviders(<CommentsSection giftId="gift-1" />, {
      session: makeAuthResult(),
    });

    await user.type(await screen.findByLabelText('Add a comment'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(await screen.findByRole('link', { name: 'Log in' })).toBeInTheDocument();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('shows API validation errors', async () => {
    server.use(
      http.get('/api/gifts/:id/comments', () => HttpResponse.json([])),
      http.post('/api/gifts/:id/comments', () =>
        HttpResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed' } },
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWithProviders(<CommentsSection giftId="gift-1" />, {
      session: makeAuthResult(),
    });

    await user.type(await screen.findByLabelText('Add a comment'), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Post comment' }));

    expect(await screen.findByText('Request validation failed')).toBeInTheDocument();
  });

  it('shows load errors with retry', async () => {
    server.use(
      http.get('/api/gifts/:id/comments', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL_ERROR', message: 'Comments unavailable' } },
          { status: 500 },
        ),
      ),
    );
    renderWithProviders(<CommentsSection giftId="gift-1" />);

    expect(await screen.findByText('Comments unavailable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
