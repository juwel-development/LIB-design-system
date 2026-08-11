import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Checklist } from './Checklist';

const renderSpecChecklist = (testId?: string) =>
  render(
    <Checklist.Root testId={testId}>
      <Checklist.Item>Confirm the delivery window</Checklist.Item>
      <Checklist.Item>Read the handover note</Checklist.Item>
      <Checklist.Item>Sign the receipt</Checklist.Item>
    </Checklist.Root>,
  );

describe('Checklist', () => {
  it('renders a ul carrying role=list, so the list is still announced once the markers strip list semantics', () => {
    renderSpecChecklist();
    const list = screen.getByRole('list');
    expect(list.tagName).toBe('UL');
    // list-style: none silently drops list semantics in Safari/VoiceOver; the explicit role restores them.
    expect(list).toHaveAttribute('role', 'list');
  });

  it('renders each item as an li', () => {
    renderSpecChecklist();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item.tagName).toBe('LI');
    }
  });

  it('draws the marker as a ::before pseudo-element - no glyph, character, dingbat, icon or ::marker content', () => {
    // The issue's explicit Must not list. The marker is a rule painted by a ::before, so no check
    // character is ever in the content and nothing is announced on each item.
    renderSpecChecklist();
    for (const item of screen.getAllByRole('listitem')) {
      expect(item.className).toMatch(/\bbefore:content-\[''\]/);
      // No list-marker styling and no invented graphic anywhere.
      expect(item.className).not.toMatch(/\bmarker:/);
      expect(item.className).not.toMatch(/list-(disc|decimal|square)/);
      expect(item.textContent).not.toMatch(/[☐☑✓✔•·◦▪]/);
    }
  });

  it('renders no interactive checkbox: this is a reading device, not a form control', () => {
    const { container } = renderSpecChecklist();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(container.querySelector('input')).toBeNull();
  });

  it('reads the rule colour and both tick dimensions as tokens, never a literal in the recipe', () => {
    renderSpecChecklist();
    for (const item of screen.getAllByRole('listitem')) {
      expect(item.className).toContain('var(--color-rule)');
      expect(item.className).toContain('var(--tick-length)');
      expect(item.className).toContain('var(--tick-thickness)');
    }
  });

  it('separates items with a border hairline and leaves the list open at both ends', () => {
    renderSpecChecklist();
    for (const item of screen.getAllByRole('listitem')) {
      // The top rule is gated on :not(:first-child), so the first item takes none and the list is
      // open at the head; there is no border-b at all, so it is open at the foot too - deliberately
      // unlike a closed list, which closes below. The rule is the `border` hairline colour.
      expect(item.className).toContain('[&:not(:first-child)]:border-t');
      expect(item.className).toContain('[&:not(:first-child)]:border-border');
      expect(item.className).not.toMatch(/(^|[\s[])border-t\b/);
      expect(item.className).not.toMatch(/\bborder-b\b/);
    }
  });

  it('renders items at the body type role in foreground, not muted - they are content, not annotation', () => {
    renderSpecChecklist();
    for (const item of screen.getAllByRole('listitem')) {
      expect(item.className).toMatch(/\btext-body\b/);
      expect(item.className).toMatch(/\btext-foreground\b/);
      expect(item.className).not.toMatch(/\btext-muted\b/);
    }
  });

  it('reads the between-item gap from the shared stack spacing token', () => {
    renderSpecChecklist();
    for (const item of screen.getAllByRole('listitem').slice(1)) {
      expect(item.className).toContain('var(--space-stack)');
    }
  });

  it('carries no dark: class anywhere - the theme re-points the tokens underneath', () => {
    const { container } = renderSpecChecklist();
    for (const element of container.querySelectorAll('*')) {
      expect(element.className).not.toMatch(/\bdark:/);
    }
  });

  it('keeps an item that contains a link reachable within that item', () => {
    render(
      <Checklist.Root>
        <Checklist.Item>
          Read the <a href={'/handover'}>handover note</a>
        </Checklist.Item>
      </Checklist.Root>,
    );
    const item = screen.getByRole('listitem');
    expect(
      within(item).getByRole('link', { name: 'handover note' }),
    ).toBeInTheDocument();
  });

  it('exposes the one sanctioned host hook through testId', () => {
    renderSpecChecklist('delivery-checklist');
    expect(screen.getByTestId('delivery-checklist')).toBeInTheDocument();
  });

  it('is one namespace object carrying exactly Root and Item', () => {
    expect(Object.keys(Checklist).sort()).toEqual(['Item', 'Root']);
  });
});
