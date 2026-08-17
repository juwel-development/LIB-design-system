import { Link } from 'Interaction/Link/Link';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Form } from './Form';

// The note the widening was filed for: a privacy line whose link has to sit inside the `<form>`.
const privacyNote = (
  <>
    {'More in our '}
    <Link href={'/privacy'}>privacy notice</Link>
  </>
);

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

  it('renders a note carrying a link inside the form, so the line stays in the element it annotates', () => {
    const { container } = render(<Form action={'/x'} note={privacyNote} />);

    const link = screen.getByRole('link', { name: 'privacy notice' });
    expect(link.closest('p')).toBeInTheDocument();
    expect(container.querySelector('form')).toContainElement(link);
  });

  it.each([
    ['sent', 'status'],
    ['failed', 'alert'],
  ] as const)(
    'gives a node note in the %s state the same region role a string note gets',
    (state, role) => {
      render(<Form action={'/x'} state={state} note={privacyNote} />);

      expect(screen.getByRole(role)).toContainElement(
        screen.getByRole('link', { name: 'privacy notice' }),
      );
    },
  );

  it.each(['idle', 'sending'] as const)(
    'leaves a node note unroled in the %s state, where it is plain prose',
    (state) => {
      render(<Form action={'/x'} state={state} note={privacyNote} />);

      expect(
        screen.getByRole('link', { name: 'privacy notice' }).closest('p'),
      ).not.toHaveAttribute('role');
    },
  );

  it('accepts a falsy but renderable note in sent and shows its value, since absence is what the outcome message asks about', () => {
    render(<Form action={'/x'} state={'sent'} note={0} />);

    expect(screen.getByRole('status')).toHaveTextContent('0');
  });

  it.each([
    ['omitted', undefined],
    ['null', null],
    ['a condition that resolved false', false],
  ])(
    'renders no note paragraph when the note is %s, so an absent note costs no empty line and no region gap',
    (_label, note) => {
      const { container } = render(<Form action={'/x'} note={note} />);

      expect(container.querySelector('form > p')).not.toBeInTheDocument();
    },
  );

  it.each([
    ['null', null],
    ['a condition that resolved false', false],
  ])(
    'refuses a sent state whose note is %s, since a node that renders nothing is no outcome message',
    (_label, note) => {
      expect(() =>
        render(<Form action={'/x'} state={'sent'} note={note} />),
      ).toThrow();
    },
  );

  it('bounds itself with the reading measure and sets no font-size, so ch resolves against body type', () => {
    const { container } = render(<Form action={'/x'} />);
    const form = container.querySelector('form');
    expect(form?.className).toContain('max-w-[var(--measure)]');
    expect(form?.className).not.toContain('text-');
  });

  it.each(['idle', 'sending', 'sent', 'failed'] as const)(
    'sets the labelling face on the note in the %s state, so a two-face theme reaches it (#90)',
    (state) => {
      render(<Form action={'/x'} state={state} note={'We never share it'} />);

      // docs/adr/0004, the amendment: a note standing beside the form is apparatus, the face
      // Footer and Table's note already take. In the base, so state selects the tone alone.
      expect(screen.getByText('We never share it').className).toContain(
        'font-secondary',
      );
    },
  );

  it('maps testId to a data-testid on the form', () => {
    render(<Form action={'/x'} testId={'subscribe-form'} />);
    expect(screen.getByTestId('subscribe-form').tagName).toBe('FORM');
  });
});
