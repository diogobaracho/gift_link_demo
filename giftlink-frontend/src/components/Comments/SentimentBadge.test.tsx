import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import SentimentBadge from './SentimentBadge';

describe('<SentimentBadge />', () => {
  it.each([
    ['positive', 'bg-success'],
    ['neutral', 'bg-secondary'],
    ['negative', 'bg-danger'],
  ] as const)('renders %s with %s', (label, cls) => {
    render(<SentimentBadge sentiment={{ label, score: 0.5 }} />);
    const badge = screen.getByText(label);
    expect(badge).toHaveClass(cls);
    expect(badge).toHaveTextContent(`${label} sentiment`);
    expect(badge).toHaveAttribute('title', 'Sentiment score 0.5');
  });

  it('renders nothing without sentiment', () => {
    const { container } = render(<SentimentBadge sentiment={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
