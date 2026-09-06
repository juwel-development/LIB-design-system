import { Button } from 'Interaction/Button/Button';
import { Link } from 'Interaction/Link/Link';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Collection as PublicCollection } from 'index';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { Collection } from './Collection';

describe('Collection', () => {
  it('publishes exactly Root and Item through the component entry point', () => {
    expect(PublicCollection).toBe(Collection);
    expect(Object.keys(PublicCollection).sort()).toEqual(['Item', 'Root']);
  });

  it('renders an empty root without invented content or items', () => {
    render(<Collection.Root />);
    expect(screen.getByRole('list')).toBeEmptyDOMElement();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders a single item without additional content', () => {
    render(
      <Collection.Root>
        <Collection.Item>Only item</Collection.Item>
      </Collection.Root>,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('list')).toHaveTextContent(/^Only item$/);
  });

  it('leaves composed controls independently operable and plain items noninteractive', () => {
    const activate$ = new Subject<void>();
    const activations: string[] = [];
    const subscription = activate$.subscribe(() =>
      activations.push('activated'),
    );
    render(
      <Collection.Root>
        <Collection.Item>Plain content</Collection.Item>
        <Collection.Item>
          <Link href={'#details'}>Details</Link>
          <Button onClick$={activate$}>Activate</Button>
        </Collection.Item>
      </Collection.Root>,
    );
    const list = screen.getByRole('list');
    const button = screen.getByRole('button', { name: 'Activate' });
    const link = screen.getByRole('link', { name: 'Details' });
    expect(link).toHaveAttribute('href', '#details');
    link.focus();
    expect(link).toHaveFocus();
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(activations).toEqual(['activated']);
    fireEvent.click(screen.getByText('Plain content'));
    expect(activations).toEqual(['activated']);
    expect(list.tabIndex).toBe(-1);
    for (const item of screen.getAllByRole('listitem'))
      expect(item.tabIndex).toBe(-1);
    expect(within(list).getAllByRole('button')).toHaveLength(1);
    subscription.unsubscribe();
  });

  it('maps each consumer test hook to the corresponding list element', () => {
    render(
      <Collection.Root testId={'collection'}>
        <Collection.Item testId={'entry'}>Entry</Collection.Item>
      </Collection.Root>,
    );
    expect(screen.getByRole('list')).toHaveAttribute(
      'data-testid',
      'collection',
    );
    expect(screen.getByRole('listitem')).toHaveAttribute(
      'data-testid',
      'entry',
    );
  });

  it('preserves accessible list semantics and consumer order through mapped items and conditional omissions', () => {
    render(
      <Collection.Root>
        {false && <Collection.Item>Omitted first item</Collection.Item>}
        {['Third', 'First'].map((label) => (
          <Collection.Item key={label}>{label}</Collection.Item>
        ))}
        {undefined}
        <Collection.Item>Second</Collection.Item>
      </Collection.Root>,
    );

    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    expect(list).toHaveAttribute('role', 'list');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Third',
      'First',
      'Second',
    ]);
    for (const item of items) expect(item.tagName).toBe('LI');
  });
});
