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

  it('sets the labelling face on everything that names the field and the content face on the value, so a two-face theme reaches every part (#90)', () => {
    render(
      <Input
        label={'Email'}
        name={'email'}
        optionalLabel={'optional'}
        hint={'We never share it'}
        invalid={true}
        errorMessage={'Enter a valid email'}
      />,
    );

    // docs/adr/0004, the amendment: the value is what was come for, everything naming it is
    // apparatus. Asserted per element, so a face moved up to the wrapper fails here.
    expect(screen.getByRole('textbox').className).toContain('font-primary');
    for (const naming of [
      'Email',
      'optional',
      'We never share it',
      'Enter a valid email',
    ]) {
      expect(screen.getByText(naming).className).toContain('font-secondary');
    }
  });

  it('sizes the label and the control at the body role, so neither takes its size from the page the field was dropped into (#92)', () => {
    render(<Input label={'Email'} name={'email'} />);

    // docs/adr/0004, the size amendment: the control takes `body` because a focused control below
    // 16px zooms iOS Safari, and the label takes the control's role because the two belong
    // together. Asserted per element, so a size moved up to the wrapper fails here.
    expect(screen.getByRole('textbox').className).toContain('text-body');
    expect(screen.getByText('Email').className).toContain('text-body');
  });

  it('keeps the weight and colour the label already carried, since the size is an addition and not a replacement (#92)', () => {
    render(<Input label={'Email'} name={'email'} />);

    const className = screen.getByText('Email').className;
    expect(className).toContain('font-medium');
    expect(className).toContain('text-foreground');
  });

  it('leaves the hint, the error message and the optional marker at the small role, unmoved by the label taking one (#92)', () => {
    render(
      <Input
        label={'Email'}
        name={'email'}
        optionalLabel={'optional'}
        hint={'We never share it'}
        invalid={true}
        errorMessage={'Enter a valid email'}
      />,
    );

    // The annotations were pinned at `small` by #79 and this ticket does not move them: what
    // changes is that the label they sit under stops being sized by the surrounding page.
    for (const annotation of [
      'optional',
      'We never share it',
      'Enter a valid email',
    ]) {
      expect(screen.getByText(annotation).className).toContain('text-small');
    }
  });
});
