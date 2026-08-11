import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Form } from './Form';

describe('Form Component', () => {
  it('renders a real form carrying action and the resolved method, so a native submission works with no JavaScript', () => {
    const { container } = render(
      <Form action={'/subscribe'}>
        <input name={'email'} />
      </Form>,
    );
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('action', '/subscribe');
    expect(form).toHaveAttribute('method', 'post');
  });

  it('resolves method from the prop when one is given', () => {
    const { container } = render(<Form action={'/search'} method={'get'} />);
    expect(container.querySelector('form')).toHaveAttribute('method', 'get');
  });

  it('renders fields and actions in idle, with the note carrying no ARIA role', () => {
    render(
      <Form
        action={'/x'}
        actions={<button type={'submit'}>Send</button>}
        note={'We never share it'}
      >
        <input name={'email'} data-testid={'field'} />
      </Form>,
    );
    expect(screen.getByTestId('field')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    const note = screen.getByText('We never share it');
    expect(note).not.toHaveAttribute('role');
  });

  it('sets aria-busy on the form only while sending, and keeps fields and actions', () => {
    const { container } = render(
      <Form
        action={'/x'}
        state={'sending'}
        actions={<button type={'submit'}>Send</button>}
      >
        <input name={'email'} data-testid={'field'} />
      </Form>,
    );
    expect(container.querySelector('form')).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(screen.getByTestId('field')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('carries no aria-busy in any state but sending', () => {
    const { container } = render(<Form action={'/x'} state={'idle'} />);
    expect(container.querySelector('form')).not.toHaveAttribute('aria-busy');
  });

  it('drops fields and actions in sent, so a completed submission cannot be resubmitted, while keeping the form element', () => {
    const { container } = render(
      <Form
        action={'/x'}
        state={'sent'}
        actions={<button type={'submit'}>Send</button>}
        note={'Thanks — check your inbox.'}
      >
        <input name={'email'} data-testid={'field'} />
      </Form>,
    );
    expect(container.querySelector('form')).toBeInTheDocument();
    expect(screen.queryByTestId('field')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Send' }),
    ).not.toBeInTheDocument();
  });

  it('marks the sent note as a status region', () => {
    render(
      <Form action={'/x'} state={'sent'} note={'Thanks — check your inbox.'} />,
    );
    expect(screen.getByText('Thanks — check your inbox.')).toHaveAttribute(
      'role',
      'status',
    );
  });

  it('marks the failed note as an alert, and keeps fields and actions so it can be retried', () => {
    render(
      <Form
        action={'/x'}
        state={'failed'}
        actions={<button type={'submit'}>Send</button>}
        note={'Something went wrong.'}
      >
        <input name={'email'} data-testid={'field'} />
      </Form>,
    );
    expect(screen.getByText('Something went wrong.')).toHaveAttribute(
      'role',
      'alert',
    );
    expect(screen.getByTestId('field')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('refuses a sent state with no note, the outcome message it exists to show', () => {
    expect(() => render(<Form action={'/x'} state={'sent'} />)).toThrow();
  });

  it('bounds itself with the reading measure and sets no font-size, so ch resolves against body type', () => {
    const { container } = render(<Form action={'/x'} />);
    const form = container.querySelector('form');
    expect(form?.className).toContain('max-w-[var(--measure)]');
    expect(form?.className).not.toContain('text-');
  });

  it('maps testId to a data-testid on the form', () => {
    render(<Form action={'/x'} testId={'subscribe-form'} />);
    expect(screen.getByTestId('subscribe-form').tagName).toBe('FORM');
  });
});
