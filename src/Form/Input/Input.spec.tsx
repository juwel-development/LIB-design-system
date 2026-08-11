import { fireEvent, render, screen } from '@testing-library/react';
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

  it('renders the word "optional" only when the field is not required', () => {
    const { rerender } = render(<Input label={'Name'} name={'name'} />);
    expect(screen.getByText('optional')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toBeRequired();

    rerender(<Input label={'Name'} name={'name'} required={true} />);
    expect(screen.queryByText('optional')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeRequired();
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
});
