import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { CSSProperties, FunctionComponent, ReactNode } from 'react';
import { FigureConfigurationError } from './FigureConfigurationError';

// One recipe on the image; wrappers carry only structure. max-w-none overrides the image preflight
// ceiling: an artwork box must retain its token extent even in a narrower holder (#172).
const figure = cva('block', {
  variants: {
    presentation: {
      framed: 'w-full object-cover bg-backing',
      artwork: 'max-w-none shrink-0 object-contain',
    },
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
  defaultVariants: { presentation: 'framed', focus: 'center' },
});

interface IFigureSourceProps {
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
   *  the image inside a positioning context. Having something to render is what makes that context
   *  exist; where inside it the overlay sits is expressed on the consumer's own element. */
  overlay?: ReactNode;
  /** Whether this image is visible when the page first paints. Set it on a hero. */
  priority?: boolean;
  testId?: string;
}

interface IFigureFramedProps
  extends IFigureSourceProps,
    Omit<VariantProps<typeof figure>, 'presentation'> {
  presentation?: Extract<VariantProps<typeof figure>['presentation'], 'framed'>;
  size?: never;
}

interface IFigureArtworkProps extends IFigureSourceProps {
  presentation: Extract<VariantProps<typeof figure>['presentation'], 'artwork'>;
  /** A consumer-declared custom property holding a positive definite CSS length. */
  size: `--${string}`;
  ratio?: never;
  focus?: never;
}

export type IFigureProps = IFigureFramedProps | IFigureArtworkProps;

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
 * - Artwork requires a consumer-owned size token name. It resolves live to a non-shrinking square,
 *   centered contain fitting without backing. Crop ratio/focus are excluded for artwork.
 * - Malformed artwork token names throw the public FigureConfigurationError.
 * - An `overlay` renders unmodified against the image box, outside the caption. Artwork wrappers
 *   retain the token width; the overlay's positioning context retains the square height as well.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Declare the artwork size token on the image or an ancestor as a positive definite CSS length.
 *   There is no computed-value validation or fallback size. Provide enough room or reflow the
 *   surrounding composition: a fixed artwork box is not promised to fit a narrower holder.
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
  presentation,
  size,
  ratio,
  focus,
  responsive,
  caption,
  overlay,
  priority,
  testId,
}) => {
  if (
    presentation === 'artwork' &&
    (typeof size !== 'string' || !/^--[A-Za-z0-9_-]+$/.test(size))
  ) {
    throw new FigureConfigurationError(
      `size must name a CSS custom property such as --consumer-artwork-size, got ${JSON.stringify(size)}`,
    );
  }
  const isArtwork = presentation === 'artwork';
  const artworkSquare: CSSProperties | undefined = isArtwork
    ? { width: `var(${size})`, height: `var(${size})` }
    : undefined;
  // Absence, not falsiness, and not `undefined` alone: `overlay={showRing && <Ring />}` hands over
  // `false` when the decoration is off, and that consumer asked for no overlay - wrapping anyway
  // would put a `div` where their flex or grid item used to be, which is the one thing this slot
  // promises never to do. Absence is React's own set of nothing-to-render nodes, so a bare
  // truthiness test is wrong in the other direction: `0` renders as `"0"`.
  const hasOverlay =
    overlay !== undefined && overlay !== null && typeof overlay !== 'boolean';

  const image = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={figure({ presentation, ratio, focus })}
      style={artworkSquare}
      srcSet={responsive?.srcSet}
      sizes={responsive?.sizes}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding={'async'}
      data-testid={caption === undefined && !hasOverlay ? testId : undefined}
    />
  );

  // Without an overlay, preserve the image itself as the caption-less flex or grid item.
  // Artwork wrappers derive their width from the image: a token declared on the image itself does
  // not inherit upwards. Resolving it again on a wrapper expanded that wrapper to its holder (#172).
  const frame = !hasOverlay ? (
    image
  ) : (
    <div
      className={isArtwork ? 'relative w-fit shrink-0 self-start' : 'relative'}
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
      className={
        isArtwork
          ? 'flex flex-col gap-[var(--space-stack)] w-min shrink-0 self-start'
          : 'flex flex-col gap-[var(--space-stack)]'
      }
      data-testid={testId}
    >
      {frame}
      <figcaption
        className={
          isArtwork
            ? 'font-secondary text-label tracking-label text-muted wrap-anywhere'
            : 'font-secondary text-label tracking-label text-muted'
        }
      >
        {caption}
      </figcaption>
    </figure>
  );
};
