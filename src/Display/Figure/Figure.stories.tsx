import type { Meta, StoryObj } from '@storybook/react-vite';
import { Figure } from './Figure';

const meta: Meta<typeof Figure> = {
  title: 'Display/Figure',
  component: Figure,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const portrait = 'https://picsum.photos/id/1005/720/900';
const square = 'https://picsum.photos/id/1025/600/600';
const wide = 'https://picsum.photos/id/1015/1600/900';
const diagram = 'https://picsum.photos/id/1062/900/600';

/** A captioned portrait: the caption makes it a `figure`, and it takes the tracked label style. */
export const CaptionedPortrait: Story = {
  args: {
    src: portrait,
    alt: '',
    width: 720,
    height: 900,
    ratio: 'portrait',
    caption: 'The maker at the bench',
  },
};

/** An uncaptioned square: the image renders alone, with no `figure` element and no self-contained claim. */
export const UncaptionedSquare: Story = {
  args: {
    src: square,
    alt: 'A ceramic bowl, glazed matte white',
    width: 600,
    height: 600,
    ratio: 'square',
  },
};

/** A wide frame anchored to the top, so the crop keeps the subject's head rather than centring it. */
export const WideFocusTop: Story = {
  args: {
    src: wide,
    alt: 'A workshop interior lit from a high window',
    width: 1600,
    height: 900,
    ratio: 'wide',
    focus: 'top',
  },
};

/** Responsive delivery: `srcSet` and `sizes` travel together, so the browser never assumes 100vw. */
export const Responsive: Story = {
  args: {
    src: wide,
    alt: 'A workshop interior',
    width: 1600,
    height: 900,
    ratio: 'landscape',
    responsive: {
      srcSet:
        'https://picsum.photos/id/1015/640/427 640w, https://picsum.photos/id/1015/1280/853 1280w',
      sizes: '(max-width: 40rem) 100vw, 40rem',
    },
  },
};

/** A deliberately broken `src`: the frame falls back to the `backing` plate with the alt text on it. */
export const BrokenSource: Story = {
  args: {
    src: 'https://example.invalid/missing.avif',
    alt: 'The maker at the bench',
    width: 720,
    height: 900,
    ratio: 'portrait',
  },
};

// The overlay is the consumer's, so the stories draw it the way a consumer would - on its own element,
// with its own positioning and its own `aria-hidden`. The library adds none of that.
const ring = (
  <span
    aria-hidden={'true'}
    style={{
      position: 'absolute',
      inset: '0.75rem',
      border: '1px solid currentColor',
      opacity: 0.65,
      pointerEvents: 'none',
    }}
  />
);

/** An overlay over a captioned portrait: the decoration rides the frame's rim and the caption stays below it. */
export const OverlayOnCaptionedPortrait: Story = {
  args: {
    src: portrait,
    alt: '',
    width: 720,
    height: 900,
    ratio: 'portrait',
    caption: 'The maker at the bench',
    overlay: ring,
  },
};

/** An overlay with no caption: the positioning context is the whole output, and there is still no `figure`. */
export const OverlayWithoutCaption: Story = {
  args: {
    src: square,
    alt: 'A ceramic bowl, glazed matte white',
    width: 600,
    height: 600,
    ratio: 'square',
    overlay: ring,
  },
};

/** No `ratio`: the image keeps its intrinsic shape, which is what a diagram or screenshot needs. */
export const IntrinsicShape: Story = {
  args: {
    src: diagram,
    alt: 'A wiring diagram',
    width: 900,
    height: 600,
  },
};
