import type { Gift } from '../../types';

const CLASSES = {
  card: { wrapper: 'image-placeholder', image: '', empty: 'no-image-available' },
  large: {
    wrapper: 'image-placeholder-large',
    image: 'product-image-large',
    empty: 'no-image-available-large',
  },
} as const;

/** Gift photo or a "No Image Available" placeholder (course MainPage Task 4, Details Task 5). */
export default function GiftImage({
  gift,
  size = 'card',
}: {
  gift: Gift;
  size?: 'card' | 'large';
}) {
  const css = CLASSES[size];
  return (
    <div className={css.wrapper}>
      {gift.image ? (
        <img src={gift.image} alt={gift.name} className={css.image || undefined} loading="lazy" />
      ) : (
        <div className={css.empty}>No Image Available</div>
      )}
    </div>
  );
}
