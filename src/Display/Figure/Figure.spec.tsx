import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Figure } from './Figure';

const source = '/portrait.avif';

const classesOf = (element: Element): string[] =>
  element.className.split(/\s+/).filter(Boolean);

const overlayNode = <span data-testid={'ring'}>ring</span>;

describe('Figure', () => {
  it('renders a figure wrapping the image and a figcaption when a caption is given', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={''}
        width={360}
        height={450}
        caption={'The maker at the bench'}
      />,
    );
    const figure = container.querySelector('figure');
    expect(figure).not.toBeNull();
    expect(figure?.querySelector('img')).not.toBeNull();
    const caption = container.querySelector('figcaption');
    expect(caption?.textContent).toBe('The maker at the bench');
  });

  it('renders the image alone with no figure element when there is no caption, so it makes no self-contained claim', () => {
    const { container } = render(
      <Figure src={source} alt={'A logo'} width={200} height={200} />,
    );
    expect(container.querySelector('figure')).toBeNull();
    expect(container.querySelector('figcaption')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('gives the figcaption the same tracked label treatment as a table caption', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={''}
        width={360}
        height={450}
        caption={'A caption'}
      />,
    );
    const caption = container.querySelector('figcaption');
    expect(caption?.className).toContain('font-secondary');
    expect(caption?.className).toContain('text-label');
    expect(caption?.className).toContain('tracking-label');
    expect(caption?.className).toContain('text-muted');
  });

  it('requires alt but accepts the empty string, emitting alt="" for a decorative or caption-named image', () => {
    const { container } = render(
      <Figure src={source} alt={''} width={360} height={450} />,
    );
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('alt', '');
  });

  it('reserves the box with the intrinsic width and height before the image loads', () => {
    render(<Figure src={source} alt={'A diagram'} width={640} height={480} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('width', '640');
    expect(image).toHaveAttribute('height', '480');
  });

  it('decodes asynchronously on every render', () => {
    render(<Figure src={source} alt={'A diagram'} width={640} height={480} />);
    expect(screen.getByRole('img')).toHaveAttribute('decoding', 'async');
  });

  it('lazy-loads by default, since most images sit below the fold', () => {
    render(<Figure src={source} alt={'A diagram'} width={640} height={480} />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).not.toHaveAttribute('fetchpriority');
  });

  it('eagerly fetches a priority image at high priority, so a hero is not deferred', () => {
    render(
      <Figure src={source} alt={'A hero'} width={1600} height={900} priority />,
    );
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('fetchpriority', 'high');
  });

  it('emits srcset and sizes together when responsive is set', () => {
    render(
      <Figure
        src={source}
        alt={'A diagram'}
        width={640}
        height={480}
        responsive={{
          srcSet: '/small.avif 320w, /large.avif 1280w',
          sizes: '(max-width: 40rem) 100vw, 40rem',
        }}
      />,
    );
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute(
      'srcset',
      '/small.avif 320w, /large.avif 1280w',
    );
    expect(image).toHaveAttribute('sizes', '(max-width: 40rem) 100vw, 40rem');
  });

  it('emits neither srcset nor sizes when responsive is unset, so a bare srcSet cannot default sizes to 100vw', () => {
    render(<Figure src={source} alt={'A diagram'} width={640} height={480} />);
    const image = screen.getByRole('img');
    expect(image).not.toHaveAttribute('srcset');
    expect(image).not.toHaveAttribute('sizes');
  });

  it.each([
    ['portrait', 'aspect-portrait'],
    ['square', 'aspect-square'],
    ['landscape', 'aspect-landscape'],
    ['wide', 'aspect-wide'],
  ] as const)('locks the frame to the %s aspect role', (ratio, utility) => {
    render(
      <Figure
        src={source}
        alt={'A diagram'}
        width={640}
        height={480}
        ratio={ratio}
      />,
    );
    expect(screen.getByRole('img').className).toContain(utility);
  });

  it('locks to no aspect role when ratio is omitted, keeping the image at its intrinsic shape', () => {
    render(<Figure src={source} alt={'A diagram'} width={640} height={480} />);
    expect(screen.getByRole('img').className).not.toMatch(/\baspect-/);
  });

  it.each([
    ['top', 'object-top'],
    ['bottom', 'object-bottom'],
    ['left', 'object-left'],
    ['right', 'object-right'],
  ] as const)('anchors the crop to the %s focal point', (focus, utility) => {
    render(
      <Figure
        src={source}
        alt={'A diagram'}
        width={640}
        height={480}
        ratio={'wide'}
        focus={focus}
      />,
    );
    expect(screen.getByRole('img').className).toContain(utility);
  });

  it('centres the crop by default', () => {
    render(
      <Figure
        src={source}
        alt={'A diagram'}
        width={640}
        height={480}
        ratio={'wide'}
      />,
    );
    expect(screen.getByRole('img').className).toContain('object-center');
  });

  it('covers the frame over the backing plate, so a slow or failed image shows a legible plate', () => {
    render(<Figure src={source} alt={'A diagram'} width={640} height={480} />);
    const className = screen.getByRole('img').className;
    expect(className).toContain('object-cover');
    expect(className).toContain('bg-backing');
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={''}
        width={360}
        height={450}
        caption={'A caption'}
      />,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  it('exposes the one sanctioned host hook through testId, on the figure when captioned', () => {
    render(
      <Figure
        src={source}
        alt={''}
        width={360}
        height={450}
        caption={'A caption'}
        testId={'hero-figure'}
      />,
    );
    expect(screen.getByTestId('hero-figure').tagName).toBe('FIGURE');
  });

  it('exposes testId on the image when there is no caption', () => {
    render(
      <Figure
        src={source}
        alt={'A logo'}
        width={200}
        height={200}
        testId={'logo'}
      />,
    );
    expect(screen.getByTestId('logo').tagName).toBe('IMG');
  });

  it('wraps nothing around the image when no overlay is given, so a captioned figure keeps holding the image and the caption directly', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={''}
        width={360}
        height={450}
        caption={'A caption'}
      />,
    );
    const children = container.querySelector('figure')?.children;
    expect(Array.from(children ?? []).map((child) => child.tagName)).toEqual([
      'IMG',
      'FIGCAPTION',
    ]);
  });

  it('wraps nothing around the image when no overlay is given and there is no caption, so the image is still the whole output', () => {
    const { container } = render(
      <Figure src={source} alt={'A logo'} width={200} height={200} />,
    );
    expect(container.children.length).toBe(1);
    expect(container.firstElementChild?.tagName).toBe('IMG');
  });

  it('places an overlay as a sibling of the image inside a positioning context, so a consumer can hang decoration off the frame', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={'A portrait'}
        width={720}
        height={900}
        ratio={'portrait'}
        overlay={overlayNode}
      />,
    );
    const frame = container.firstElementChild;
    expect(frame?.tagName).toBe('DIV');
    expect(frame && classesOf(frame)).toContain('relative');
    expect(
      Array.from(frame?.children ?? []).map((child) => child.tagName),
    ).toEqual(['IMG', 'SPAN']);
  });

  it('keeps the overlay between the image and the figcaption, in a context wrapping the image only', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={''}
        width={720}
        height={900}
        caption={'The maker at the bench'}
        overlay={overlayNode}
      />,
    );
    const figure = container.querySelector('figure');
    expect(
      Array.from(figure?.children ?? []).map((child) => child.tagName),
    ).toEqual(['DIV', 'FIGCAPTION']);
    const frame = figure?.firstElementChild;
    expect(frame && classesOf(frame)).toContain('relative');
    expect(frame?.querySelector('img')).not.toBeNull();
    expect(frame?.querySelector('figcaption')).toBeNull();
    expect(screen.getByTestId('ring').previousElementSibling?.tagName).toBe(
      'IMG',
    );
  });

  it('renders the overlay exactly as passed: no class, no ARIA attribute, nothing stripped', () => {
    render(
      <Figure
        src={source}
        alt={'A portrait'}
        width={720}
        height={900}
        overlay={overlayNode}
      />,
    );
    const overlay = screen.getByTestId('ring');
    expect(overlay.className).toBe('');
    expect(overlay.textContent).toBe('ring');
    for (const attribute of overlay.getAttributeNames()) {
      expect(attribute).not.toMatch(/^(aria-|role$)/);
    }
  });

  it('leaves an overlay decorative marking to the consumer, passing through the aria-hidden it was given', () => {
    render(
      <Figure
        src={source}
        alt={'A portrait'}
        width={720}
        height={900}
        overlay={
          <span aria-hidden={'true'} data-testid={'ring'}>
            ring
          </span>
        }
      />,
    );
    expect(screen.getByTestId('ring')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders a figure element only where there is a caption, whether or not an overlay is given', () => {
    const { container, rerender } = render(
      <Figure
        src={source}
        alt={'A portrait'}
        width={720}
        height={900}
        overlay={overlayNode}
      />,
    );
    expect(container.querySelector('figure')).toBeNull();

    rerender(
      <Figure
        src={source}
        alt={''}
        width={720}
        height={900}
        caption={'A caption'}
        overlay={overlayNode}
      />,
    );
    expect(container.querySelector('figure')).not.toBeNull();
  });

  it('exposes testId on the positioning context when there is an overlay and no caption, since that is the outermost element', () => {
    render(
      <Figure
        src={source}
        alt={'A portrait'}
        width={720}
        height={900}
        overlay={overlayNode}
        testId={'plate'}
      />,
    );
    const outermost = screen.getByTestId('plate');
    expect(outermost.tagName).toBe('DIV');
    expect(outermost.querySelector('img')).not.toBeNull();
  });

  it('keeps testId on the figure when there is both an overlay and a caption, so there is one hook and not two', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={''}
        width={720}
        height={900}
        caption={'A caption'}
        overlay={overlayNode}
        testId={'plate'}
      />,
    );
    expect(screen.getByTestId('plate').tagName).toBe('FIGURE');
    expect(container.querySelectorAll('[data-testid="plate"]').length).toBe(1);
  });

  it('reserves the box and honours ratio, focus, responsive and priority with an overlay present', () => {
    render(
      <Figure
        src={source}
        alt={'A portrait'}
        width={720}
        height={900}
        ratio={'portrait'}
        focus={'top'}
        priority
        responsive={{
          srcSet: '/small.avif 320w, /large.avif 1280w',
          sizes: '(max-width: 40rem) 100vw, 40rem',
        }}
        overlay={overlayNode}
      />,
    );
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('width', '720');
    expect(image).toHaveAttribute('height', '900');
    expect(image.className).toContain('aspect-portrait');
    expect(image.className).toContain('object-top');
    expect(image).toHaveAttribute('loading', 'eager');
    expect(image).toHaveAttribute('fetchpriority', 'high');
    expect(image).toHaveAttribute(
      'srcset',
      '/small.avif 320w, /large.avif 1280w',
    );
    expect(image).toHaveAttribute('sizes', '(max-width: 40rem) 100vw, 40rem');
  });

  it('paints nothing on the frame: the positioning context carries the anchor and no other class', () => {
    const { container } = render(
      <Figure
        src={source}
        alt={'A portrait'}
        width={720}
        height={900}
        overlay={overlayNode}
      />,
    );
    const frame = container.firstElementChild;
    expect(frame && classesOf(frame)).toEqual(['relative']);
  });
});
