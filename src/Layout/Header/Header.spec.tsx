import { Link } from 'Interaction/Link/Link';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  it('renders a banner containing the standing slot and a nav wrapping the children', () => {
    render(
      <Header standing={<a href={'/'}>JuweL</a>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const banner = screen.getByRole('banner');
    expect(banner.tagName).toBe('HEADER');
    expect(screen.getByRole('link', { name: 'JuweL' })).toBeInTheDocument();
    const nav = screen.getByRole('navigation');
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Work' }));
  });

  it('names the nav for assistive technology only when navName is given, emitting no aria-label otherwise', () => {
    const { rerender } = render(
      <Header testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    // An unnamed nav is still a landmark; an empty aria-label would be worse than none - it matters
    // once a page has a second nav (#15 Footer). Same rule Section follows for its name.
    expect(screen.getByRole('navigation')).not.toHaveAttribute('aria-label');

    rerender(
      <Header navName={'Primary'} testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    expect(
      screen.getByRole('navigation', { name: 'Primary' }),
    ).toBeInTheDocument();
  });

  it('sets the header at the label type role and carries no size literal of its own', () => {
    render(
      <Header testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const banner = screen.getByTestId('h');
    expect(banner.className).toContain('font-secondary');
    expect(banner.className).toContain('text-label');
    expect(banner.className).toContain('tracking-label');
    expect(banner.className).toContain('text-muted');
    // "never grows past 1rem" was the label role wearing a number: no size literal appears anywhere.
    expect(banner.className).not.toContain('1rem');
    expect(banner.className).not.toMatch(/text-\[/);
  });

  it('leads itself at the label role, so the nav line box is the library own rather than the consuming document one', () => {
    // The label role sizes but did not lead, so the bar's height was inherited from whatever document
    // the shell landed in (#81). Setting the leading here is what makes the height stateable at all.
    render(
      <Header testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    expect(screen.getByTestId('h').className).toContain('leading-label');
  });

  it('floors the standing slot at the nav line box, written from the same two tokens the nav is set from', () => {
    // The floor and the rendered line box have to be one expression or they drift, which is the whole
    // point of the fix. jsdom lays nothing out, so what is pinned here is that the slot's minimum
    // height names exactly the two tokens the header sets its own type from - a third name, or a
    // literal, would be the drift. The rendered result is Storybook's surface, not this suite's.
    render(
      <Header standing={<a href={'/'}>JuweL</a>} testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const banner = screen.getByTestId('h');
    const slot = screen.getByRole('link', { name: 'JuweL' })
      .parentElement as HTMLElement;
    expect(slot.className).toContain(
      'min-h-[calc(var(--text-label)*var(--leading-label))]',
    );
    expect(banner.className).toContain('text-label');
    expect(banner.className).toContain('leading-label');
  });

  it('floors the standing slot at the slot width role and centres what fills it, so a mark and a place name agree', () => {
    render(
      <Header standing={<a href={'/'}>JuweL</a>} testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const slot = screen.getByRole('link', { name: 'JuweL' })
      .parentElement as HTMLElement;
    expect(slot.className).toContain('min-w-[var(--standing-min-width)]');
    expect(slot.className).toContain('inline-flex');
    expect(slot.className).toContain('items-center');
  });

  it('still aligns the two slots on their baselines, so a standing place name sits on the nav line', () => {
    // The slot centres its own contents - which is what a mark shorter than the floor needs - while the
    // bar goes on aligning the slot and the nav on their baselines. A flex container's baseline is its
    // first item's, so the standing text's baseline is what the nav is aligned against, as before.
    render(
      <Header standing={<a href={'/'}>JuweL</a>} testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    expect(screen.getByTestId('h').className).toContain('items-baseline');
  });

  it('floors the standing slot without fixing it, so a long place name grows the slot instead of wrapping inside it', () => {
    // A definite size was measured and rejected: it fills a mark correctly and clamps a long place
    // name to the floor, wrapping it (.out-of-scope/brandmark-size-vocabulary.md). So no width or
    // height utility may appear, and the slot may not shrink below its content - an explicit
    // min-width replaces a flex item's automatic minimum, which is what would let it be squeezed.
    render(
      <Header
        standing={<a href={'/'}>{'A rather long standing place name'}</a>}
        testId={'h'}
      >
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const slot = screen.getByRole('link', {
      name: 'A rather long standing place name',
    }).parentElement as HTMLElement;
    expect(slot.className).not.toMatch(/(^|\s)[wh]-\[/);
    expect(slot.className).not.toMatch(/(^|\s)(?:basis|max-[wh])-/);
    expect(slot.className).toContain('shrink-0');
  });

  it('lifts a real quiet Link marked current to the foreground, winning the specificity conflict with text-muted', () => {
    // The whole point of the descendant selector: Link's `quiet` sets text-muted (0,1,0) straight on
    // the anchor, and Header's [&_[aria-current=page]] compiles to 0,2,0, so foreground wins with no
    // !important and no import. A bare <a aria-current="page"> would not carry text-muted and so would
    // not exercise the conflict this test exists to catch - it must be a real Link.
    render(
      <Header testId={'h'}>
        <Link treatment={'quiet'} href={'/here'} current={true}>
          Here
        </Link>
      </Header>,
    );
    const banner = screen.getByTestId('h');
    expect(banner.className).toContain(
      '[&_[aria-current=page]]:text-foreground',
    );
    const current = screen.getByRole('link', { name: 'Here' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current.className).toContain('text-muted');
  });

  it('draws a bottom rule by default and none when edge is set to none', () => {
    const { rerender } = render(
      <Header testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const ruled = screen.getByTestId('h');
    expect(ruled.className).toContain('border-b');
    expect(ruled.className).toContain('border-solid');
    expect(ruled.className).toContain('border-rule');

    rerender(
      <Header edge={'none'} testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    expect(screen.getByTestId('h').className).not.toContain('border-b');
  });

  it('gives the shell one air value in every direction: space-region above, below and between, gutter across', () => {
    render(
      <Header testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const banner = screen.getByTestId('h');
    expect(banner.className).toContain('py-[var(--space-region)]');
    expect(banner.className).toContain('px-[var(--gutter)]');
    expect(screen.getByRole('navigation').className).toContain(
      'gap-[var(--space-region)]',
    );
  });

  it('is never sticky and needs no JavaScript, so it renders identically server-side', () => {
    const { container } = render(
      <Header testId={'h'}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\b(sticky|fixed)\b/);
    }
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = render(
      <Header standing={<a href={'/'}>JuweL</a>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
