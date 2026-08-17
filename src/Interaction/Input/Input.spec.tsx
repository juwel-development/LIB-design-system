import { act, fireEvent, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders a labelled text control', () => {
    render(<Input label={'Email'} name={'email'} />);
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('maps its variant to the input type', () => {
    render(<Input label={'Email'} name={'email'} variant={'email'} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('is a plain text field by default', () => {
    render(<Input label={'Name'} name={'name'} />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
  });

  it('associates the label with the control through matching htmlFor and id', () => {
    render(<Input label={'Email'} name={'email'} />);
    const control = screen.getByRole('textbox');
    expect(control.id).toBeTruthy();
    expect(screen.getByText('Email')).toHaveAttribute('for', control.id);
  });

  it('describes the control with the hint when one is given', () => {
    render(<Input label={'Email'} name={'email'} hint={'We never share it'} />);
    const control = screen.getByRole('textbox');
    expect(control.getAttribute('aria-describedby')).toContain(
      screen.getByText('We never share it').id,
    );
  });

  it('conveys the invalid state through aria-invalid and a message in words, never colour alone', () => {
    render(
      <Input
        label={'Email'}
        name={'email'}
        invalid={true}
        errorMessage={'Enter a valid email'}
      />,
    );
    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    const message = screen.getByText('Enter a valid email');
    expect(message).toBeInTheDocument();
    expect(control.getAttribute('aria-describedby')).toContain(message.id);
  });

  it("marks a non-required field in the caller's own wording, in whatever language they write", () => {
    const { rerender } = render(
      <Input label={'Name'} name={'name'} optionalLabel={'freiwillig'} />,
    );
    expect(screen.getByText('freiwillig')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toBeRequired();

    rerender(
      <Input
        label={'Name'}
        name={'name'}
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
    const { container } = render(<Input label={'Name'} name={'name'} />);
    expect(screen.getByRole('textbox')).not.toBeRequired();
    expect(container.textContent).toBe('Name');
  });

  it('works with JavaScript disabled: the control carries name, value and required with no onInput$', () => {
    render(
      <Input
        label={'Name'}
        name={'fullName'}
        defaultValue={'Ada'}
        required={true}
      />,
    );
    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('name', 'fullName');
    expect(control).toHaveValue('Ada');
    expect(control).toBeRequired();
  });

  it('emits the current value on input through its Subject', () => {
    const onInput$ = new Subject<string>();
    const handleInput = vi.fn();
    onInput$.subscribe(handleInput);
    render(<Input label={'Name'} name={'name'} onInput$={onInput$} />);
    fireEvent.input(screen.getByRole('textbox'), { target: { value: 'Ada' } });
    expect(handleInput).toHaveBeenCalledWith('Ada');
  });

  it('marks the disabled control so it cannot be edited', () => {
    render(<Input label={'Name'} name={'name'} disabled={true} />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('empties the control in place when reset$ emits, so focus and composition survive', () => {
    const reset$ = new Subject<void>();
    render(
      <Input
        label={'Name'}
        name={'name'}
        defaultValue={'Ada'}
        reset$={reset$}
      />,
    );
    const control = screen.getByRole('textbox');
    control.focus();
    expect(control).toHaveValue('Ada');
    expect(control).toHaveFocus();

    act(() => reset$.next());

    expect(control).toHaveValue('');
    expect(control).toHaveFocus();
  });
});
