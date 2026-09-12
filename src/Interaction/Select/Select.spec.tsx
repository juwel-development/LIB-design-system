import { fireEvent, render, screen } from '@testing-library/react';
import { Select } from 'index';
import { type ComponentProps, Fragment } from 'react';
import { Subject } from 'rxjs';
import { describe, expect, expectTypeOf, it } from 'vitest';

describe('Select', () => {
  it('publishes one closed namespace with curated member props', () => {
    expect(typeof Select).toBe('object');
    expect(Object.keys(Select)).toEqual(['Root', 'Option']);
    expectTypeOf<keyof typeof Select>().toEqualTypeOf<'Root' | 'Option'>();
    expectTypeOf<keyof ComponentProps<typeof Select.Root>>().toEqualTypeOf<
      | 'label'
      | 'name'
      | 'required'
      | 'optionalLabel'
      | 'disabled'
      | 'invalid'
      | 'hint'
      | 'errorMessage'
      | 'testId'
      | 'defaultValue'
      | 'onChange$'
      | 'placeholder'
      | 'children'
    >();
    expectTypeOf<keyof ComponentProps<typeof Select.Option>>().toEqualTypeOf<
      'value' | 'children' | 'testId'
    >();
    expectTypeOf<
      ComponentProps<typeof Select.Option>['children']
    >().toEqualTypeOf<string>();
    expectTypeOf<
      ComponentProps<typeof Select.Root>['onChange$']
    >().toEqualTypeOf<Subject<string> | undefined>();
  });

  it('renders consumer components, fragments, arrays and conditional options as native choices', () => {
    const EuropeanMarkets = () => (
      <>
        <Select.Option value={'de'} testId={'german-market'}>
          {'Deutschland'}
        </Select.Option>
        {['fr', 'gb'].map((value) => (
          <Select.Option key={value} value={value}>
            {value}
          </Select.Option>
        ))}
        {false && <Select.Option value={'es'}>{'España'}</Select.Option>}
      </>
    );
    render(
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        defaultValue={'fr'}
      >
        <EuropeanMarkets />
      </Select.Root>,
    );
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(screen.getByRole('combobox')).toHaveValue('fr');
    expect(screen.getByRole('option', { name: 'Deutschland' })).toHaveAttribute(
      'data-testid',
      'german-market',
    );
  });

  it('resets a surviving composed default after translation and reordering, then resets empty after its removal', () => {
    const onChange$ = new Subject<string>();
    const received: string[] = [];
    onChange$.subscribe((value) => received.push(value));
    const field = (values: string[], germanName: string) => (
      <form aria-label={'Setup'}>
        <Select.Root
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          required={true}
          defaultValue={'de'}
          onChange$={onChange$}
        >
          <Fragment key={'markets'}>
            {values.map((value) => (
              <Select.Option key={value} value={value}>
                {value === 'de' ? germanName : 'France'}
              </Select.Option>
            ))}
          </Fragment>
        </Select.Root>
      </form>
    );
    const { rerender } = render(field(['de', 'fr'], 'Germany'));
    const control = screen.getByRole('combobox');
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Setup' });
    fireEvent.change(control, { target: { value: 'fr' } });
    rerender(field(['fr', 'de'], 'Deutschland'));
    form.reset();
    expect(control).toHaveValue('de');
    rerender(field(['fr'], 'Deutschland'));
    fireEvent.change(control, { target: { value: 'fr' } });
    form.reset();
    expect(control).toHaveValue('');
    expect(control).toBeInvalid();
    expect(new FormData(form).get('homeMarket')).toBe('');
    rerender(field(['de', 'fr'], 'Deutschland'));
    fireEvent.change(control, { target: { value: 'de' } });
    form.reset();
    expect(control).toHaveValue('');
    expect(received).toEqual(['fr', 'fr', 'de']);
  });

  it('composes a native field from the public Root and Option members', () => {
    render(
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        required={true}
      >
        <Select.Option value={'de'}>{'Deutschland'}</Select.Option>
      </Select.Root>,
    );
    const control = screen.getByRole('combobox', { name: 'Home market' });
    expect(control).toHaveValue('');
    expect(control).toBeInvalid();
    fireEvent.change(control, { target: { value: 'de' } });
    expect(control).toHaveValue('de');
    expect(control).toBeValid();
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent(
      'Deutschland',
    );
  });
  it('starts with a named, empty native single selection instead of choosing a market for the user', () => {
    render(
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
      >
        <Select.Option key={'de'} value={'de'}>
          {'Deutschland'}
        </Select.Option>
      </Select.Root>,
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
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
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
        <Select.Root
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          required={true}
        >
          <Select.Option key={'de'} value={'de'}>
            {'Deutschland'}
          </Select.Option>
        </Select.Root>
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
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        onChange$={onChange$}
      >
        <Select.Option key={'de'} value={'de'}>
          {'Deutschland'}
        </Select.Option>
      </Select.Root>,
    );
    const control = screen.getByRole('combobox');
    control.focus();
    expect(control).toHaveFocus();
    expect(control).toHaveValue('');
    expect(received).toEqual([]);

    fireEvent.change(control, { target: { value: 'de' } });
    expect(received).toEqual(['de']);

    rerender(
      <Select.Root
        label={'Heimatmarkt'}
        name={'homeMarket'}
        placeholder={'Markt auswählen'}
        onChange$={onChange$}
      >
        <Select.Option key={'de'} value={'de'}>
          {'Germany'}
        </Select.Option>
      </Select.Root>,
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
        <Select.Root
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          defaultValue={'de'}
          disabled={true}
          required={true}
          onChange$={onChange$}
        >
          <Select.Option key={'de'} value={'de'}>
            {'Deutschland'}
          </Select.Option>
        </Select.Root>
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
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
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
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
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
      <Select.Root
        label={'Vergleichsmarkt'}
        name={'comparisonMarket'}
        placeholder={'Kein Vergleich'}
        optionalLabel={'freiwillig'}
      />,
    );
    expect(screen.getByRole('combobox')).not.toBeRequired();
    expect(screen.getByText('freiwillig')).toBeInTheDocument();
    rerender(
      <Select.Root
        label={'Vergleichsmarkt'}
        name={'comparisonMarket'}
        placeholder={'Kein Vergleich'}
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
        <Select.Root
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          defaultValue={'de'}
          onChange$={onChange$}
        >
          <Select.Option key={'de'} value={'de'}>
            {'Deutschland'}
          </Select.Option>
          <Select.Option key={'gb'} value={'gb'}>
            {'United Kingdom'}
          </Select.Option>
        </Select.Root>
      </form>,
    );
    const control = screen.getByRole('combobox');
    expect(control).toHaveValue('de');
    expect(received).toEqual([]);
    fireEvent.change(control, { target: { value: 'gb' } });
    rerender(
      <form aria-label={'Setup'}>
        <Select.Root
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          defaultValue={''}
          onChange$={onChange$}
        >
          <Select.Option key={'de'} value={'de'}>
            {'Deutschland'}
          </Select.Option>
          <Select.Option key={'gb'} value={'gb'}>
            {'United Kingdom'}
          </Select.Option>
        </Select.Root>
      </form>,
    );
    expect(control).toHaveValue('gb');
    screen.getByRole<HTMLFormElement>('form', { name: 'Setup' }).reset();
    expect(control).toHaveValue('de');
    expect(received).toEqual(['gb']);
  });

  it('preserves a selected stable value when options reorder and labels change', () => {
    const { rerender } = render(
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
      >
        <Select.Option key={'de'} value={'de'}>
          {'Deutschland'}
        </Select.Option>
        <Select.Option key={'gb'} value={'gb'}>
          {'United Kingdom'}
        </Select.Option>
      </Select.Root>,
    );
    const control = screen.getByRole('combobox');
    fireEvent.change(control, { target: { value: 'gb' } });

    rerender(
      <Select.Root
        label={'Heimatmarkt'}
        name={'homeMarket'}
        placeholder={'Markt auswählen'}
      >
        <Select.Option key={'gb'} value={'gb'}>
          {'Vereinigtes Königreich'}
        </Select.Option>
        <Select.Option key={'de'} value={'de'}>
          {'Deutschland'}
        </Select.Option>
        <Select.Option key={'fr'} value={'fr'}>
          {'Frankreich'}
        </Select.Option>
      </Select.Root>,
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
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        required={true}
        onChange$={onChange$}
      >
        <Select.Option key={'de'} value={'de'}>
          {'Deutschland'}
        </Select.Option>
        <Select.Option key={'gb'} value={'gb'}>
          {'United Kingdom'}
        </Select.Option>
      </Select.Root>,
    );
    const control = screen.getByRole('combobox');
    fireEvent.change(control, { target: { value: 'de' } });

    rerender(
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        required={true}
        onChange$={onChange$}
      >
        <Select.Option key={'gb'} value={'gb'}>
          {'United Kingdom'}
        </Select.Option>
      </Select.Root>,
    );
    expect(control).toHaveValue('');
    expect(control).toBeInvalid();
    expect(received).toEqual(['de']);
  });

  it('stays empty when options arrive after an unmatched initial value', () => {
    const { rerender } = render(
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        defaultValue={'de'}
      />,
    );
    const control = screen.getByRole('combobox');
    expect(control).toHaveValue('');
    expect(control).toBeValid();
    rerender(
      <Select.Root
        label={'Home market'}
        name={'homeMarket'}
        placeholder={'Choose a market'}
        defaultValue={'de'}
      >
        <Select.Option key={'de'} value={'de'}>
          {'Deutschland'}
        </Select.Option>
      </Select.Root>,
    );
    expect(control).toHaveValue('');
  });

  it('keeps selections and output streams independent between fields', () => {
    const homeChanges$ = new Subject<string>();
    const comparisonChanges$ = new Subject<string>();
    const homeValues: string[] = [];
    const comparisonValues: string[] = [];
    homeChanges$.subscribe((value) => homeValues.push(value));
    comparisonChanges$.subscribe((value) => comparisonValues.push(value));
    render(
      <>
        <Select.Root
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          onChange$={homeChanges$}
        >
          <Select.Option value={'de'}>{'Germany'}</Select.Option>
        </Select.Root>
        <Select.Root
          label={'Comparison market'}
          name={'comparisonMarket'}
          placeholder={'No comparison'}
          onChange$={comparisonChanges$}
        >
          <Select.Option value={'de'}>{'Germany'}</Select.Option>
        </Select.Root>
      </>,
    );
    const home = screen.getByRole('combobox', { name: 'Home market' });
    const comparison = screen.getByRole('combobox', {
      name: 'Comparison market',
    });
    fireEvent.change(home, { target: { value: 'de' } });
    expect(comparison).toHaveValue('');
    expect(comparisonValues).toEqual([]);
    fireEvent.change(comparison, { target: { value: 'de' } });
    fireEvent.change(comparison, { target: { value: '' } });
    expect(home).toHaveValue('de');
    expect(homeValues).toEqual(['de']);
    expect(comparisonValues).toEqual(['de', '']);
  });

  it('keeps each fields label and messages distinct and invents no missing wording', () => {
    render(
      <>
        <Select.Root
          label={'Home market'}
          name={'homeMarket'}
          placeholder={'Choose a market'}
          hint={'Where your label is based'}
        />
        <Select.Root
          label={'Comparison market'}
          name={'comparisonMarket'}
          placeholder={'No comparison'}
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
