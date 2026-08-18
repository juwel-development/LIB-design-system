import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe, on the `img` - the only element that varies. The wrapper `figure` and the `figcaption`
// carry literal class strings in JSX (the Input pattern, not the compound namespace: there is nothing
// here to compose). `ratio` has no default, so an omitted ratio emits no aspect-* class and the image
// keeps its intrinsic shape; `focus` defaults to center and is inert without a ratio, since object-*
// has nothing to crop in the base. Colours are semantic tokens re-pointed by `.dark`, so no `dark:`.
const figure = cva('block w-full object-cover bg-backing', {
  variants: {
    ratio: {
      portrait: 'aspect-portrait',
      square: 'aspect-square',
      landscape: 'aspect-landscape',
      wide: 'aspect-wide',
    },
    focus: {
      center: 'object-center',
      top: 'object-top',
      bottom: 'object-bottom',
      left: 'object-left',
      right: 'object-right',
    },
  },
  defaultVariants: { focus: 'center' },
});

export interface IFigureProps extends VariantProps<typeof figure> {
  /** The image source. Produce it through the consuming build's image pipeline - see @UXGuidelines. */
  src: string;
  /** The image's text alternative. Empty string when the image is decorative, or when `caption`
   *  already names it - a non-empty alt beside a caption reads the same content to a screen reader
   *  twice. */
  alt: string;
  /** The source's intrinsic pixel width. */
  width: number;
  /** The source's intrinsic pixel height. */
  height: number;
  /** Responsive delivery. One decision with two parts, so they are one prop: a `srcSet` with `w`
   *  descriptors and no `sizes` makes the browser assume 100vw and download the largest candidate. */
  responsive?: { srcSet: string; sizes: string };
  /** Names the image. Its presence is what makes this a `figure`. */
  caption?: string;
  /** A slot over the image frame - the consumer's own decoration, rendered unmodified as a sibling of
   *  the image inside a positioning context. Its presence is what makes that context exist; where
   *  inside it the overlay sits is expressed on the consumer's own element. */
  overlay?: ReactNode;
  /** Whether this image is visible when the page first paints. Set it on a hero. */
  priority?: boolean;
  testId?: string;
}

/**
 * An aspect-locked image frame with a focal point and an optional caption. The caption decides the
 * element: with one, the image is wrapped in a `figure` with a `figcaption`; without one, the image
 * renders alone, making no self-contained claim a thumbnail or logo should not make. An `overlay`
 * decides a second element the same way: with one, the image sits in a positioning context the
 * overlay can be placed against; without one, there is no wrapper at all.
 *
 * @Guarantees — enforced on every render
 * - Every image reserves its box before it loads: an intrinsic `width`/`height`, and a locked
 *   `aspect-ratio` once a `ratio` is given.
 * - `decoding="async"` always; `loading` follows `priority` (`eager`+`fetchpriority="high"` when set,
 *   `lazy` otherwise), so an above-the-fold hero is never deferred.
 * - A `figure` element appears only where there is a caption.
 * - `srcset` never ships without `sizes`: `responsive` bundles the two so one cannot go without the other.
 * - An `overlay` renders unmodified: the component adds no class and no ARIA attribute to it, strips
 *   nothing from it, and paints nothing on the frame - the wrapper it renders carries the positioning
 *   context and no other property, so the image fills its container exactly as it does without one.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - A decorative overlay carries the consumer's own `aria-hidden="true"`. The library will not add it:
 *   a slot it modifies is no longer a slot.
 *
 * @UXGuidelines
 * - Pass a `src` your build's image pipeline produced. One raw source measured 2 MB against 31.6 KB
 *   for the same crop, taking `load` from 0.95 s to 10.3 s. The component cannot check this.
 * - Check a photograph's hue range before putting a brand colour beside it. One frame sat entirely
 *   between hue 14° and 40°, so an amber call-to-action muddied against a terracotta wall - the accent
 *   lives where the photo isn't. The component paints nothing over the frame itself, so this is about
 *   what a page puts next to a figure - and about what it puts in `overlay`, which is the consumer's
 *   own decoration and answers to the same hue range.
 * - `overlay` is a place, not a treatment. The library provides somewhere legal for a rim, a ring or a
 *   plate to go, and provides none of them; positioning it inside the frame is the consumer's, expressed
 *   on their own absolutely-positioned element.
 */
export const Figure: FunctionComponent<IFigureProps> = ({
  src,
  alt,
  width,
  height,
  ratio,
  focus,
  responsive,
  caption,
  overlay,
  priority,
  testId,
}) => {
  const image = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={figure({ ratio, focus })}
      srcSet={responsive?.srcSet}
      sizes={responsive?.sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={'async'}
      data-testid={
        caption === undefined && overlay === undefined ? testId : undefined
      }
    />
  );

  // The positioning context exists only where there is something to position, so an overlay-less
  // `Figure` renders exactly what it rendered before this slot existed - which matters most in the
  // caption-less shape, where the image itself is the flex or grid item its container sees.
  const frame =
    overlay === undefined ? (
      image
    ) : (
      <div
        className={'relative'}
        data-testid={caption === undefined ? testId : undefined}
      >
        {image}
        {overlay}
      </div>
    );

  if (caption === undefined) {
    return frame;
  }

  return (
    <figure
      className={'flex flex-col gap-[var(--space-stack)]'}
      data-testid={testId}
    >
      {frame}
      <figcaption
        className={'font-secondary text-label tracking-label text-muted'}
      >
        {caption}
      </figcaption>
    </figure>
  );
};
