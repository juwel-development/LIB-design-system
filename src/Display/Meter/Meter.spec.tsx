import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Meter } from './Meter';
import { MeterConfigurationError } from './MeterConfigurationError';

describe('Meter', () => {
  it('is discoverable as a meter named by its label, so assistive technology reads what the level measures', () => {
    render(<Meter value={62} max={100} label={'Patience'} />);
    expect(screen.getByRole('meter', { name: 'Patience' })).toBeInTheDocument();
  });

  it('reports the value and both bounds through the ARIA value attributes', () => {
    render(<Meter value={62} min={10} max={100} label={'Patience'} />);
    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '62');
    expect(meter).toHaveAttribute('aria-valuemin', '10');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
  });

  it('defaults the minimum to zero, the common bottom of a share-of-a-whole scale', () => {
    render(<Meter value={62} max={100} label={'Patience'} />);
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuemin', '0');
  });

  it('carries the value text exactly when supplied, so a screen reader hears the consumer wording instead of a bare number', () => {
    const { rerender } = render(
      <Meter value={20} max={100} label={'Patience'} valueText={'strained'} />,
    );
    expect(screen.getByRole('meter')).toHaveAttribute(
      'aria-valuetext',
      'strained',
    );
    rerender(<Meter value={20} max={100} label={'Patience'} />);
    expect(screen.getByRole('meter')).not.toHaveAttribute('aria-valuetext');
  });

  it('renders no visible wording of its own - the label is accessible-only and there is no readout or caption', () => {
    const { container } = render(
      <Meter value={62} max={100} label={'Patience'} valueText={'steady'} />,
    );
    expect(container.textContent).toBe('');
  });

  it('is not focusable, since it displays a state and takes no interaction', () => {
    render(<Meter value={62} max={100} label={'Patience'} />);
    expect(screen.getByRole('meter')).not.toHaveAttribute('tabindex');
  });

  it('hides the visual fill from the accessibility tree - the meter role already carries the level', () => {
    const { container } = render(
      <Meter value={62} max={100} label={'Patience'} />,
    );
    const fill = container.querySelector('[aria-hidden="true"]');
    expect(fill).not.toBeNull();
  });

  it('lands the testId on the semantic root, the consumer e2e hook', () => {
    render(<Meter value={62} max={100} label={'Patience'} testId={'meter'} />);
    expect(screen.getByTestId('meter')).toBe(screen.getByRole('meter'));
  });

  // jsdom performs no layout, so the width the share produces cannot be measured here; what is
  // checkable is the one number the component hands its stylesheet - the custom property both the
  // fill width and the depletion mix read. The stories show the painted result.
  it('exposes the filled share as (value - min) / (max - min) of the whole', () => {
    render(<Meter value={62} max={100} label={'Patience'} />);
    expect(
      screen.getByRole('meter').style.getPropertyValue('--meter-level'),
    ).toBe('0.62');
  });

  it('normalizes the share against non-zero and negative bounds, not against zero', () => {
    render(<Meter value={5} min={-10} max={10} label={'Charge'} />);
    expect(
      screen.getByRole('meter').style.getPropertyValue('--meter-level'),
    ).toBe('0.75');
  });

  it('keeps its semantics and share under RTL direction - the fill flows from inline-start by block layout, not a physical offset', () => {
    render(
      <div dir={'rtl'}>
        <Meter value={62} max={100} label={'Patience'} />
      </div>,
    );
    const meter = screen.getByRole('meter', { name: 'Patience' });
    expect(meter).toHaveAttribute('aria-valuenow', '62');
    expect(meter.style.getPropertyValue('--meter-level')).toBe('0.62');
  });

  it('accepts both endpoints of the scale as values', () => {
    render(<Meter value={0} max={100} label={'Empty'} />);
    render(<Meter value={100} max={100} label={'Full'} />);
    expect(screen.getByRole('meter', { name: 'Empty' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(screen.getByRole('meter', { name: 'Full' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('keeps the depleting treatment a paint decision - the semantics do not move with it', () => {
    render(
      <Meter value={20} max={100} treatment={'depleting'} label={'Patience'} />,
    );
    const meter = screen.getByRole('meter', { name: 'Patience' });
    expect(meter).toHaveAttribute('aria-valuenow', '20');
    expect(meter.style.getPropertyValue('--meter-level')).toBe('0.2');
  });

  it.each([
    ['a non-finite value', Number.NaN, 0, 100],
    ['an infinite value', Number.POSITIVE_INFINITY, 0, 100],
    ['a non-finite minimum', 50, Number.NaN, 100],
    ['a non-finite maximum', 50, 0, Number.POSITIVE_INFINITY],
  ] as const)(
    'throws MeterConfigurationError for %s, a programmer error rather than a state to repair',
    (_case, value, min, max) => {
      expect(() =>
        render(<Meter value={value} min={min} max={max} label={'Broken'} />),
      ).toThrowError(MeterConfigurationError);
    },
  );

  it('throws when the bounds collapse or invert, since a scale needs a positive extent', () => {
    expect(() =>
      render(<Meter value={5} min={5} max={5} label={'Flat'} />),
    ).toThrowError(MeterConfigurationError);
    expect(() =>
      render(<Meter value={5} min={10} max={0} label={'Inverted'} />),
    ).toThrowError(MeterConfigurationError);
  });

  it('throws for a value outside the inclusive range instead of clamping it, so a wrong number cannot render as a plausible level', () => {
    expect(() =>
      render(<Meter value={101} max={100} label={'Over'} />),
    ).toThrowError(MeterConfigurationError);
    expect(() =>
      render(<Meter value={-1} max={100} label={'Under'} />),
    ).toThrowError(MeterConfigurationError);
  });

  it('does not judge the label contents - an empty string renders, its wording being the consumer responsibility', () => {
    expect(() =>
      render(<Meter value={62} max={100} label={''} />),
    ).not.toThrow();
  });
});
