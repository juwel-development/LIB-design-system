import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from 'index';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';

describe('Select', () => {
  it('starts with a named, empty native single selection instead of choosing a market for the user', () => {
    render(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        options={[{ value: 'de', label: 'Deutschland' }]}
      />,
    );

    const control = screen.getByRole('combobox', { name: 'Home market' });
    expect(control.tagName).toBe('SELECT');
    expect(control).not.toHaveAttribute('multiple');
    expect(control).toHaveAttribute('name', 'homeMarket');
    expect(control).toHaveValue('');
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent(
      'Choose a market',
    );
    expect(screen.getByRole('option', { name: 'Deutschland' })).toHaveValue(
      'de',
    );
    expect(screen.getByLabelText('Home market')).toBe(control);
  });

  it('exposes the consumer test hook on the named control', () => {
    render(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        options={[]}
        testId={'home-market'}
      />,
    );
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'data-testid',
      'home-market',
    );
  });
  it('requires a real choice and submits the stable value instead of its localized label', () => {
    render(
      <form aria-label={'Setup'}>
        <Select
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          required={true}
          options={[{ value: 'de', label: 'Deutschland' }]}
        />
      </form>,
    );
    const control = screen.getByRole('combobox');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Setup' });
    expect(control).toBeRequired();
    expect(control).toBeInvalid();
    expect(form.checkValidity()).toBe(false);

    fireEvent.change(control, { target: { value: 'de' } });

    expect(control).toBeValid();
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get('homeMarket')).toBe('de');

    fireEvent.change(control, { target: { value: '' } });
    expect(control).toBeInvalid();
  });
  it('emits one stable value per change, including clearing, and stays silent on mount, focus and rerender', () => {
    const onChange$ = new Subject<string>();
    const received: string[] = [];
    onChange$.subscribe((value) => received.push(value));
    const { rerender, unmount } = render(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        options={[{ value: 'de', label: 'Deutschland' }]}
        onChange$={onChange$}
      />,
    );
    const control = screen.getByRole('combobox');
    control.focus();
    expect(control).toHaveFocus();
    expect(control).toHaveValue('');
    expect(received).toEqual([]);

    fireEvent.change(control, { target: { value: 'de' } });
    expect(received).toEqual(['de']);

    rerender(
      <Select
        label={'Heimatmarkt'}
        name={'homeMarket'}
        placeholder={'Markt auswählen'}
        options={[{ value: 'de', label: 'Germany' }]}
        onChange$={onChange$}
      />,
    );
    expect(received).toEqual(['de']);
    expect(control).toHaveValue('de');
    fireEvent.change(control, { target: { value: '' } });
    expect(received).toEqual(['de', '']);

    unmount();
    onChange$.next('consumer still owns the stream');
    expect(received).toEqual(['de', '', 'consumer still owns the stream']);
  });

  it('keeps a disabled field visible but unfocusable, excluded from submission and silent on changes', () => {
    const onChange$ = new Subject<string>();
    const received: string[] = [];
    onChange$.subscribe((value) => received.push(value));
    render(
      <form aria-label={'Setup'}>
        <Select
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          defaultValue={'de'}
          disabled={true}
          required={true}
          options={[{ value: 'de', label: 'Deutschland' }]}
          onChange$={onChange$}
        />
      </form>,
    );
    const control = screen.getByRole('combobox');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Setup' });
    expect(control).toBeDisabled();
    expect(control).toHaveValue('de');
    control.focus();
    expect(control).not.toHaveFocus();
    expect(new FormData(form).has('homeMarket')).toBe(false);
    expect(form.checkValidity()).toBe(true);
    fireEvent.change(control, { target: { value: '' } });
    expect(received).toEqual([]);
  });

  it('associates hint and error wording with its control and removes stale error associations', () => {
    const { rerender } = render(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        options={[]}
        hint={'Choose where your label is based'}
        invalid={true}
        errorMessage={'Choose an available market'}
      />,
    );
    const control = screen.getByRole('combobox');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toHaveAccessibleDescription(
      'Choose where your label is based Choose an available market',
    );

    rerender(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        options={[]}
        hint={'Choose where your label is based'}
        errorMessage={'Choose an available market'}
      />,
    );
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(control).toHaveAccessibleDescription(
      'Choose where your label is based',
    );
    expect(
      screen.queryByText('Choose an available market'),
    ).not.toBeInTheDocument();
  });

  it('marks optional fields only in the callers wording and hides the marker when required', () => {
    const { rerender, container } = render(
      <Select
        label={'Vergleichsmarkt'}
        name={'comparisonMarket'}
        placeholder={'Kein Vergleich'}
        options={[]}
        optionalLabel={'freiwillig'}
      />,
    );
    expect(screen.getByRole('combobox')).not.toBeRequired();
    expect(screen.getByText('freiwillig')).toBeInTheDocument();
    rerender(
      <Select
        label={'Vergleichsmarkt'}
        name={'comparisonMarket'}
        placeholder={'Kein Vergleich'}
        options={[]}
        optionalLabel={'freiwillig'}
        required={true}
      />,
    );
    expect(screen.queryByText('freiwillig')).not.toBeInTheDocument();
    expect(container.textContent).toBe('VergleichsmarktKein Vergleich');
  });

  it('uses defaultValue only for initialization and restores it silently on native form reset', () => {
    const onChange$ = new Subject<string>();
    const received: string[] = [];
    onChange$.subscribe((value) => received.push(value));
    const { rerender } = render(
      <form aria-label={'Setup'}>
        <Select
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          defaultValue={'de'}
          options={[
            { value: 'de', label: 'Deutschland' },
            { value: 'gb', label: 'United Kingdom' },
          ]}
          onChange$={onChange$}
        />
      </form>,
    );
    const control = screen.getByRole('combobox');
    expect(control).toHaveValue('de');
    expect(received).toEqual([]);
    fireEvent.change(control, { target: { value: 'gb' } });
    rerender(
      <form aria-label={'Setup'}>
        <Select
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          defaultValue={''}
          options={[
            { value: 'de', label: 'Deutschland' },
            { value: 'gb', label: 'United Kingdom' },
          ]}
          onChange$={onChange$}
        />
      </form>,
    );
    expect(control).toHaveValue('gb');
    screen.getByRole<HTMLFormElement>('form', { name: 'Setup' }).reset();
    expect(control).toHaveValue('de');
    expect(received).toEqual(['gb']);
  });

  it('preserves a selected stable value when options reorder and labels change', () => {
    const { rerender } = render(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        options={[
          { value: 'de', label: 'Deutschland' },
          { value: 'gb', label: 'United Kingdom' },
        ]}
      />,
    );
    const control = screen.getByRole('combobox');
    fireEvent.change(control, { target: { value: 'gb' } });

    rerender(
      <Select
        label={'Heimatmarkt'}
        name={'homeMarket'}
        placeholder={'Markt auswählen'}
        options={[
          { value: 'gb', label: 'Vereinigtes Königreich' },
          { value: 'de', label: 'Deutschland' },
          { value: 'fr', label: 'Frankreich' },
        ]}
      />,
    );
    expect(control).toHaveValue('gb');
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent(
      'Vereinigtes Königreich',
    );
  });

  it('returns silently to empty and required-invalid when the selected option disappears', () => {
    const onChange$ = new Subject<string>();
    const received: string[] = [];
    onChange$.subscribe((value) => received.push(value));
    const { rerender } = render(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        required={true}
        options={[
          { value: 'de', label: 'Deutschland' },
          { value: 'gb', label: 'United Kingdom' },
        ]}
        onChange$={onChange$}
      />,
    );
    const control = screen.getByRole('combobox');
    fireEvent.change(control, { target: { value: 'de' } });

    rerender(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        required={true}
        options={[{ value: 'gb', label: 'United Kingdom' }]}
        onChange$={onChange$}
      />,
    );
    expect(control).toHaveValue('');
    expect(control).toBeInvalid();
    expect(received).toEqual(['de']);
  });

  it('stays empty when options arrive after an unmatched initial value', () => {
    const { rerender } = render(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        defaultValue={'de'}
        options={[]}
      />,
    );
    const control = screen.getByRole('combobox');
    expect(control).toHaveValue('');
    expect(control).toBeValid();
    rerender(
      <Select
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        defaultValue={'de'}
        options={[{ value: 'de', label: 'Deutschland' }]}
      />,
    );
    expect(control).toHaveValue('');
  });

  it('keeps each fields label and messages distinct and invents no missing wording', () => {
    render(
      <>
        <Select
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          options={[]}
          hint={'Where your label is based'}
        />
        <Select
          label={'Comparison market'}
          name={'comparisonMarket'}
          placeholder={'No comparison'}
          options={[]}
          invalid={true}
        />
      </>,
    );
    const home = screen.getByRole('combobox', { name: 'Home market' });
    const comparison = screen.getByRole('combobox', {
      name: 'Comparison market',
    });
    expect(home.id).not.toBe(comparison.id);
    expect(home).toHaveAccessibleDescription('Where your label is based');
    expect(comparison).not.toHaveAttribute('aria-describedby');
    expect(comparison).toHaveAttribute('aria-invalid', 'true');
    expect(comparison.parentElement?.textContent).toBe(
      'Comparison marketNo comparison',
    );
  });
});
