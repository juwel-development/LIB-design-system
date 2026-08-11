import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Link } from './Link';

describe('Link', () => {
  it('renders an anchor carrying the href and children, so it navigates with JavaScript disabled', () => {
    render(<Link href={'/pricing'}>Pricing</Link>);
    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it.each(['prose', 'quiet', 'label-link', 'graphic'] as const)(
    'renders a navigable link for the %s treatment',
    (treatment) => {
      render(
        <Link href={'/about'} treatment={treatment}>
          About
        </Link>,
      );
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute(
        'href',
        '/about',
      );
    },
  );

  it('opens an external link in a new tab and severs the opener, both together', () => {
    render(
      <Link href={'https://example.com'} external={true}>
        Docs
      </Link>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('stays same-tab with no rel by default, so the bundle is not settable a value at a time', () => {
    render(<Link href={'/local'}>Local</Link>);
    const link = screen.getByRole('link', { name: 'Local' });
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('marks the current page for assistive technology when current is set', () => {
    render(
      <Link href={'/here'} current={true}>
        Here
      </Link>,
    );
    expect(screen.getByRole('link', { name: 'Here' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('sets no aria-current when the link is not the current page', () => {
    render(<Link href={'/elsewhere'}>Elsewhere</Link>);
    expect(screen.getByRole('link', { name: 'Elsewhere' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('exposes a stable test hook through testId', () => {
    render(
      <Link href={'/x'} testId={'nav-link'}>
        X
      </Link>,
    );
    expect(screen.getByTestId('nav-link')).toBeInTheDocument();
  });
});
