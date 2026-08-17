import { act, fireEvent, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TextArea } from './TextArea';

describe('TextArea Component', () => {
  it('renders a labelled multi-line text control', () => {
    render(<TextArea label={'Message'} name={'message'} />);
    expect(
      screen.getByRole('textbox', { name: 'Message' }),
    ).toBeInTheDocument();
  });

  it('associates the label with the control through matching htmlFor and id', () => {
    render(<TextArea label={'Message'} name={'message'} />);
    const control = screen.getByRole('textbox');
    expect(control.id).toBeTruthy();
    expect(screen.getByText('Message')).toHaveAttribute('for', control.id);
  });

  it('describes the control with the hint when one is given', () => {
    render(
      <TextArea label={'Message'} name={'message'} hint={'A few sentences'} />,
    );
    const control = screen.getByRole('textbox');
    expect(control.getAttribute('aria-describedby')).toContain(
      screen.getByText('A few sentences').id,
    );
  });

  it('conveys the invalid state through aria-invalid and a message in words, never colour alone', () => {
    render(
      <TextArea
        label={'Message'}
        name={'message'}
        invalid={true}
        errorMessage={'Tell us a little more'}
      />,
    );
    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    const message = screen.getByText('Tell us a little more');
    expect(message).toBeInTheDocument();
    expect(control.getAttribute('aria-describedby')).toContain(message.id);
  });

  it("marks a non-required field in the caller's own wording, in whatever language they write", () => {
    const { rerender } = render(
      <TextArea
        label={'Message'}
        name={'message'}
        optionalLabel={'freiwillig'}
      />,
    );
    expect(screen.getByText('freiwillig')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toBeRequired();

    rerender(
      <TextArea
        label={'Message'}
        name={'message'}
        optionalLabel={'freiwillig'}
        required={true}
      />,
    );
    expect(screen.queryByText('freiwillig')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('marks nothing when the caller supplies no wording, so the library ships no wording of its own', () => {
    // The assertion is the field's whole rendered text against the one word the caller gave, not
    // the absence of `optional`: a reintroduced default in any language fails this, an English-only
    // check would only catch the one that was removed.
    const { container } = render(
      <TextArea label={'Message'} name={'message'} />,
    );
    expect(screen.getByRole('textbox')).not.toBeRequired();
    expect(container.textContent).toBe('Message');
  });

  it('works with JavaScript disabled: the control carries name, value and required with no onInput$', () => {
    render(
      <TextArea
        label={'Message'}
        name={'message'}
        defaultValue={'Hello'}
        required={true}
      />,
    );
    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('name', 'message');
    expect(control).toHaveValue('Hello');
    expect(control).toBeRequired();
  });

  it('emits the current value on input through its Subject', () => {
    const onInput$ = new Subject<string>();
    const handleInput = vi.fn();
    onInput$.subscribe(handleInput);
    render(<TextArea label={'Message'} name={'message'} onInput$={onInput$} />);
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Hi' } });
    expect(handleInput).toHaveBeenCalledWith('Hi');
  });

  it('marks the disabled control so it cannot be edited', () => {
    render(<TextArea label={'Message'} name={'message'} disabled={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('empties the control in place when reset$ emits, so focus and composition survive', () => {
    const reset$ = new Subject<void>();
    render(
      <TextArea
        label={'Message'}
        name={'message'}
        defaultValue={'Hello'}
        reset$={reset$}
      />,
    );
    const control = screen.getByRole('textbox');
    control.focus();
    expect(control).toHaveValue('Hello');
    expect(control).toHaveFocus();

    act(() => reset$.next());

    expect(control).toHaveValue('');
    expect(control).toHaveFocus();
  });

  it('sets the labelling face on everything that names the field and the content face on the value, so a two-face theme reaches every part (#90)', () => {
    render(
      <TextArea
        label={'Message'}
        name={'message'}
        optionalLabel={'optional'}
        hint={'Keep it short'}
        invalid={true}
        errorMessage={'Enter a message'}
      />,
    );

    // docs/adr/0004, the amendment: the value is what was come for, everything naming it is
    // apparatus. Asserted per element, so a face moved up to the wrapper fails here.
    expect(screen.getByRole('textbox').className).toContain('font-primary');
    for (const naming of [
      'Message',
      'optional',
      'Keep it short',
      'Enter a message',
    ]) {
      expect(screen.getByText(naming).className).toContain('font-secondary');
    }
  });
});
