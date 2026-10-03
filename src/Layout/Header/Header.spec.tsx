import { Link } from 'Interaction/Link/Link';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
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
      <Header>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    expect(screen.getByRole('banner').className).toContain('leading-label');
  });

  it('floors the standing slot at the nav line box, written from the same two tokens the nav is set from', () => {
    // The floor and the rendered line box have to be one expression or they drift, which is the whole
    // point of the fix. jsdom lays nothing out, so what is pinned here is that the slot's minimum
    // height names exactly the two tokens the header sets its own type from - a third name, or a
    // literal, would be the drift. The rendered result is Storybook's surface, not this suite's.
    render(
      <Header standing={<a href={'/'}>JuweL</a>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const banner = screen.getByRole('banner');
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
      <Header standing={<a href={'/'}>JuweL</a>}>
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
      <Header standing={<a href={'/'}>JuweL</a>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    expect(screen.getByRole('banner').className).toContain('items-baseline');
  });

  it('floors the standing slot without fixing it, so a long place name grows the slot instead of wrapping inside it', () => {
    // A definite size on the *slot* was measured and rejected: it fills a mark correctly and clamps a
    // long place name to the floor, wrapping it (.out-of-scope/brandmark-size-vocabulary.md). So no
    // width or height utility may appear here, and the slot may not shrink below its content - an
    // explicit min-width replaces a flex item's automatic minimum, which is what would let it be
    // squeezed. A definite width on the caller's own mark is a different thing and is the rule
    // `@CallerMustEnsure` states: it sizes what fills the slot, never the slot.
    render(
      <Header
        standing={<a href={'/'}>{'A rather long standing place name'}</a>}
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

  it('renders exactly the standing slot and the nav when neither status nor action is given, as before #125', () => {
    const { container } = render(
      <Header standing={<a href={'/'}>JuweL</a>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    const banner = screen.getByRole('banner');
    expect(banner.children).toHaveLength(2);
    expect(banner.lastElementChild).toBe(screen.getByRole('navigation'));
    expect(container.querySelectorAll('nav')).toHaveLength(1);
  });

  it('keeps rendering the standing slot and a navigation landmark for a caller with no nav links, as it did before #125', () => {
    // Compatibility, not taste: the navigation bar is the default mode and every existing call renders
    // the markup it always rendered, an empty nav included.
    const { rerender } = render(<Header standing={<a href={'/'}>JuweL</a>} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('banner').children).toHaveLength(2);

    rerender(<Header standing={<a href={'/'}>JuweL</a>}>{false}</Header>);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('banner').children).toHaveLength(2);
  });

  it('renders a status bar with the readout in the banner and no navigation landmark anywhere', () => {
    // The consumer's Top bar had put its Balance line inside the nav slot, because that was the only
    // slot after the standing one - a readout presented as navigation (#125).
    const { container } = render(
      <Header status={<p>{'Balance: $1,250'}</p>} />,
    );
    const status = screen.getByText('Balance: $1,250');
    expect(screen.getByRole('banner')).toContainElement(status);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(container.querySelector('nav')).toBeNull();
  });

  it('renders the action in the banner, outside any navigation landmark, and leaves it operable', () => {
    const onClick = vi.fn();
    const { container } = render(
      <Header
        action={
          <button type={'button'} onClick={onClick}>
            Continue
          </button>
        }
      />,
    );
    const action = screen.getByRole('button', { name: 'Continue' });
    expect(screen.getByRole('banner')).toContainElement(action);
    expect(container.querySelector('nav')).toBeNull();
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledTimes(1);
    action.focus();
    expect(action).toHaveFocus();
  });

  it('starts the status bar with the readout itself, reserving no standing slot before it', () => {
    render(
      <Header
        status={<p>{'Balance: $1,250'}</p>}
        action={<button type={'button'}>Continue</button>}
      />,
    );
    const banner = screen.getByRole('banner');
    const statusSlot = screen.getByText('Balance: $1,250').parentElement;
    expect(banner.firstElementChild).toBe(statusSlot);
    expect(banner.children).toHaveLength(2);
  });

  it('gives the status and action slots no landmark, no role and no live region of their own', () => {
    // The matter carries its own semantics - a paragraph reads as text, a button as a button - and
    // whether a changing readout is announced is the consumer's call, made by wrapping its own live
    // region. The library must not decide that a Balance line interrupts.
    render(
      <Header
        status={<p>{'Balance: $1,250'}</p>}
        action={<button type={'button'}>Continue</button>}
      />,
    );
    const statusSlot = screen.getByText('Balance: $1,250')
      .parentElement as HTMLElement;
    const actionSlot = screen.getByRole('button', { name: 'Continue' })
      .parentElement as HTMLElement;
    for (const slot of [statusSlot, actionSlot]) {
      expect(slot.tagName).toBe('DIV');
      expect(slot).not.toHaveAttribute('role');
      expect(slot).not.toHaveAttribute('aria-live');
      expect(slot).not.toHaveAttribute('aria-label');
      expect(slot.parentElement).toBe(screen.getByRole('banner'));
    }
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('group')).not.toBeInTheDocument();
  });

  it('passes the consumer supplied semantics through unchanged: a live region, a heading and a disabled control', () => {
    render(
      <Header
        status={
          <div role={'status'} aria-live={'polite'}>
            <h1>Week 12</h1>
          </div>
        }
        action={
          <button type={'button'} disabled={true}>
            Continue
          </button>
        }
      />,
    );
    const banner = screen.getByRole('banner');
    expect(banner).toContainElement(screen.getByRole('status'));
    expect(banner).toContainElement(
      screen.getByRole('heading', { name: 'Week 12' }),
    );
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });

  it('orders status before the action in the DOM, so reading and keyboard order run status then action', () => {
    render(
      <Header
        status={<a href={'/balance'}>Balance</a>}
        action={<button type={'button'}>Continue</button>}
      />,
    );
    const status = screen.getByRole('link', { name: 'Balance' });
    const action = screen.getByRole('button', { name: 'Continue' });
    expect(
      status.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const focusables = Array.from(
      screen.getByRole('banner').querySelectorAll('a, button'),
    );
    expect(focusables).toEqual([status, action]);
  });

  it('renders no wrapper for an omitted slot, so a status-only or action-only bar carries no empty box', () => {
    const { rerender } = render(<Header status={<p>{'Balance: $1,250'}</p>} />);
    expect(screen.getByRole('banner').children).toHaveLength(1);

    rerender(<Header action={<button type={'button'}>Continue</button>} />);
    expect(screen.getByRole('banner').children).toHaveLength(1);
  });

  it('stays a status bar when its action is withheld, so a condition that yields false renders no empty box and no nav', () => {
    // `{isRunnable && <Button/>}` is how a consumer withholds the action; the bar it is in does not
    // turn into a navigation bar for it.
    const { container, rerender } = render(
      <Header status={<p>{'Balance: $1,250'}</p>} action={false} />,
    );
    expect(screen.getByRole('banner').children).toHaveLength(1);
    expect(container.querySelector('nav')).toBeNull();

    rerender(<Header action={null} />);
    expect(screen.getByRole('banner').children).toHaveLength(0);
    expect(container.querySelector('nav')).toBeNull();
  });

  it('rejects a bar that mixes the navigation and the status/action shapes at the type level', () => {
    // The brief's contract (#125): two modes, told apart by the compiler. Each push below is a
    // mixed shape and each must fail to type-check, or typecheck fails on the unused directive.
    const shapes: ReactNode[] = [];
    shapes.push(
      // @ts-expect-error a standing link belongs to the navigation bar, a status slot to the other
      <Header standing={<a href={'/'}>JuweL</a>} status={<p>Balance</p>} />,
    );
    shapes.push(
      // @ts-expect-error nav links and an action do not share a bar
      <Header action={<button type={'button'}>Continue</button>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    shapes.push(
      // @ts-expect-error a nav name names a nav the status bar does not render
      <Header
        navName={'Primary'}
        action={<button type={'button'}>Continue</button>}
      />,
    );
    shapes.push(
      // @ts-expect-error the arrangement is read off the slots, never set by a caller
      <Header mode={'statusAction'} status={<p>Balance</p>} />,
    );
    expect(shapes).toHaveLength(4);
  });

  it('is never sticky and needs no JavaScript, so it renders identically server-side', () => {
    const { container, rerender } = render(
      <Header
        testId={'h'}
        status={<p>{'Balance'}</p>}
        action={<button type={'button'}>Continue</button>}
      />,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\b(sticky|fixed)\b/);
    }
    rerender(
      <Header standing={<a href={'/'}>JuweL</a>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\b(sticky|fixed)\b/);
    }
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container, rerender } = render(
      <Header
        status={<p>{'Balance'}</p>}
        action={<button type={'button'}>Continue</button>}
      />,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
    rerender(
      <Header standing={<a href={'/'}>JuweL</a>}>
        <a href={'/work'}>Work</a>
      </Header>,
    );
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });
});
