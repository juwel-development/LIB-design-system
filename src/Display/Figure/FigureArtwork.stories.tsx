import type { Meta, StoryObj } from '@storybook/react-vite';
import { Figure } from 'index';
import { type ComponentProps, type CSSProperties, useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';

type ArtworkProps = Extract<
  ComponentProps<typeof Figure>,
  { presentation: 'artwork' }
>;

const meta: Meta<ArtworkProps> = {
  title: 'Display/Figure/Artwork',
  component: Figure,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Opt in with \`presentation="artwork" size="--catalog-artwork-size"\`. The consumer owns the token name and declares a positive definite CSS length on the image or an ancestor:

\`\`\`css
.catalog { --catalog-artwork-size: 64px; }
.catalog.featured { --catalog-artwork-size: 96px; }
\`\`\`
\`\`\`tsx
<div className="catalog">
  <Figure presentation="artwork" size="--catalog-artwork-size"
    src="/illustration.svg" alt="An illustrated compass" width={600} height={300} />
</div>
\`\`\`

The token resolves live to both dimensions of a square image box. Any positive definite length works; 32/64/128 are examples, never library presets. Pixel tokens stay fixed when the root font or holder changes; relative lengths follow their CSS unit. The source's numeric \`width\`/\`height\` remain intrinsic dimensions for delivery, not display dimensions. The library does not inspect computed token values or invent a fallback for an undeclared token. Declaring a valid length is the caller's responsibility; percentages, zero, negative, auto and unresolved values do not meet the contract.

\`size\` accepts a custom-property name (\`--\${string}\`) only, never a number, raw length, \`var()\` or expression. Malformed names throw the exported \`FigureConfigurationError\`. There is no className/style passthrough. \`ratio\` and \`focus\` belong to the framed presentation and are excluded for artwork: artwork always centers and contain-fits the entire source artboard, preserving proportions and transparency without backing, border, frame or mask.

The image and any caption/overlay wrappers do not shrink in flex or expand to the holder. Provide enough room or let the surrounding composition reflow, as the wrapping rows below do; a holder narrower than the fixed box is not promised to fit it. A caption stays below and outside the square; an overlay is rendered unmodified against the square box. The outermost element owns \`testId\`. Required \`alt\` (including decorative \`alt=""\`), responsive delivery, priority/loading/fetch priority and asynchronous decoding retain their existing contracts. Omit \`presentation\` for unchanged full-width, backed cover fitting with optional crop/focus controls.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<ArtworkProps>;

type FixtureTheme = CSSProperties & Record<`--${string}`, string>;

const fixtureTheme: FixtureTheme = {
  '--fixture-artwork-small': '32px',
  '--fixture-artwork-medium': '64px',
  '--fixture-artwork-large': '128px',
  '--fixture-artwork-fourth': '93px',
  '--fixture-artwork-live': '64px',
  color: 'var(--color-foreground)',
  background: 'var(--color-surface)',
  padding: 16,
};

// Transparent source fixtures have marks touching all four artboard edges. Cropping loses a mark;
// a backing hides the checkerboard through the center opening and transparent margins.
const sourceFor = (width: number, height: number): string =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="M0 0H24V24H0ZM${width - 24} 0h24v24h-24ZM0 ${height - 24}h24v24H0ZM${width - 24} ${height - 24}h24v24h-24Z" fill="#d7263d"/><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 3}" ry="${height / 3}" fill="none" stroke="#146ac8" stroke-width="12"/></svg>`)}`;

const squareSource = sourceFor(200, 200);
const wideSource = sourceFor(300, 150);
const tallSource = sourceFor(150, 300);

const checker: CSSProperties = {
  backgroundColor: '#fff',
  backgroundImage:
    'conic-gradient(#b8c7d4 25%, transparent 0 50%, #b8c7d4 0 75%, transparent 0)',
  backgroundSize: '16px 16px',
};

const overlay = (
  <span
    aria-hidden={'true'}
    data-testid={'artwork-overlay'}
    style={{
      position: 'absolute',
      inset: 0,
      outline: '1px dashed #19855a',
      pointerEvents: 'none',
    }}
  />
);

const ArtworkGallery = () => {
  const [extent, setExtent] = useState('64px');
  return (
    <div
      data-testid={'artwork-gallery'}
      style={
        { ...fixtureTheme, '--fixture-artwork-live': extent } as FixtureTheme
      }
    >
      <p>
        Consumer tokens: 32, 64, 128 and 93 CSS pixels. Red marks touch every
        source edge; the checkerboard shows through transparent pixels.
      </p>
      {(['roomy', 'constrained'] as const).map((layout) => (
        <section
          key={layout}
          data-layout={layout}
          style={{
            width: layout === 'roomy' ? 640 : 220,
            maxWidth: '100%',
            marginBlock: 16,
          }}
        >
          <h2>{layout}</h2>
          {(['small', 'medium', 'large', 'fourth'] as const).map((size) => (
            <div
              key={size}
              data-size={size}
              style={{
                ...checker,
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'start',
                gap: 12,
                marginBlock: 12,
              }}
            >
              <Figure
                src={wideSource}
                alt={`Wide edge artwork ${layout} ${size}`}
                width={300}
                height={150}
                priority
                presentation={'artwork'}
                size={`--fixture-artwork-${size}`}
                testId={`${layout}-${size}`}
              />
              <span style={{ flex: '1 0 150px', color: '#172838' }}>
                Neighboring text reflows while the artwork keeps its selected
                extent.
              </span>
            </div>
          ))}
        </section>
      ))}
      <section
        data-testid={'wrapper-examples'}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 24,
          ...checker,
          backgroundImage: `linear-gradient(to bottom, transparent 128px, var(--color-surface) 128px), ${checker.backgroundImage}`,
          backgroundSize: '100% 100%, 16px 16px',
        }}
      >
        <Figure
          src={squareSource}
          alt={'Square edge artwork'}
          width={200}
          height={200}
          priority
          presentation={'artwork'}
          size={'--fixture-artwork-large'}
          testId={'bare-artwork'}
        />
        <Figure
          src={tallSource}
          alt={''}
          width={150}
          height={300}
          priority
          presentation={'artwork'}
          size={'--fixture-artwork-large'}
          caption={'A caption outside the square, wrapping readably.'}
          testId={'caption-artwork'}
        />
        <Figure
          src={wideSource}
          alt={'Wide artwork with overlay'}
          width={300}
          height={150}
          priority
          presentation={'artwork'}
          size={'--fixture-artwork-large'}
          overlay={overlay}
          testId={'overlay-artwork'}
        />
        <Figure
          src={squareSource}
          alt={''}
          width={200}
          height={200}
          priority
          presentation={'artwork'}
          size={'--fixture-artwork-large'}
          caption={'Caption and unmodified overlay'}
          overlay={overlay}
          testId={'both-artwork'}
        />
      </section>
      <section style={{ marginBlock: 24 }}>
        <button
          type={'button'}
          onClick={() => setExtent(extent === '64px' ? '117px' : '64px')}
        >
          Change consumer token
        </button>
        <div style={checker}>
          <Figure
            src={wideSource}
            alt={'Live token artwork'}
            width={300}
            height={150}
            priority
            presentation={'artwork'}
            size={'--fixture-artwork-live'}
            testId={'live-artwork'}
          />
        </div>
      </section>
      <section style={{ width: 240 }}>
        <p>
          Unchanged default: backed, full holder width, cover crop with top
          focus.
        </p>
        <Figure
          src={wideSource}
          alt={'Default framed comparison'}
          width={300}
          height={150}
          priority
          ratio={'square'}
          focus={'top'}
          testId={'default-figure'}
        />
      </section>
    </div>
  );
};

export const ConsumerTokens: Story = {
  render: () => <ArtworkGallery />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const layout of ['roomy', 'constrained']) {
      for (const [size, extent] of [
        ['small', 32],
        ['medium', 64],
        ['large', 128],
        ['fourth', 93],
      ] as const) {
        const image = canvas.getByTestId(`${layout}-${size}`);
        await expect(image.getBoundingClientRect().width).toBe(extent);
        await expect(image.getBoundingClientRect().height).toBe(extent);
      }
    }
    const image = canvas.getByRole('img', { name: 'Live token artwork' });
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change consumer token' }),
    );
    await waitFor(() => expect(image.getBoundingClientRect().width).toBe(117));
    await expect(canvas.getByRole('img', { name: 'Live token artwork' })).toBe(
      image,
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change consumer token' }),
    );
    await waitFor(() => expect(image.getBoundingClientRect().width).toBe(64));
  },
};
