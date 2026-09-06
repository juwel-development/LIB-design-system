import { fireEvent, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';
import { SliderConfigurationError } from './SliderConfigurationError';

const renderSlider = (
  overrides: Partial<Parameters<typeof Slider>[0]> = {},
) => {
  const onInput$ = new Subject<number>();
  const { container } = render(
    <Slider
      min={20}
      max={300}
      step={5}
      value={60}
      onInput$={onInput$}
      label={'Weekly Wage in $'}
      {...overrides}
    />,
  );
  return { onInput$, container };
};

describe('Slider Component', () => {
  it('renders a slider carrying the accessible name the consumer gave it', () => {
    renderSlider();
    expect(
      screen.getByRole('slider', { name: 'Weekly Wage in $' }),
    ).toBeInTheDocument();
  });

  it('maps the operating range onto the native control, so position and movement follow the bounds', () => {
    renderSlider();
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '20');
    expect(slider).toHaveAttribute('max', '300');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('moves by whole steps of one when the consumer names no increment', () => {
    renderSlider({ step: undefined });
    expect(screen.getByRole('slider')).toHaveAttribute('step', '1');
  });

  it('shows the value the consumer holds, since the control is controlled', () => {
    renderSlider();
    expect(screen.getByRole('slider')).toHaveValue('60');
  });

  it("announces the consumer's wording for the value through aria-valuetext", () => {
    renderSlider({ valueText: '$60 a week' });
    expect(screen.getByRole('slider')).toHaveAttribute(
      'aria-valuetext',
      '$60 a week',
    );
  });

  it('announces the bare number when no wording is given, adding none of its own', () => {
    renderSlider();
    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-valuetext');
  });

  it('emits the new value as a number on every input through its Subject', () => {
    const { onInput$ } = renderSlider();
    const handleInput = vi.fn();
    onInput$.subscribe(handleInput);
    fireEvent.input(screen.getByRole('slider'), { target: { value: '65' } });
    expect(handleInput).toHaveBeenCalledWith(65);
  });

  it('keeps showing the consumer-held value when an emission is not passed back in', () => {
    // Controlled means controlled: the emitted 65 never becomes component state on its own.
    const { onInput$ } = renderSlider();
    onInput$.subscribe(() => {
      // A consumer that listens but does not pass the value back.
    });
    fireEvent.input(screen.getByRole('slider'), { target: { value: '65' } });
    expect(screen.getByRole('slider')).toHaveValue('60');
  });

  it('renders no text of its own: no value display, no min/max captions', () => {
    const { container } = renderSlider({ valueText: '$60 a week' });
    expect(container.textContent).toBe('');
  });

  it('is natively disabled when the consumer says so', () => {
    renderSlider({ disabled: true });
    expect(screen.getByRole('slider')).toBeDisabled();
  });

  it.each([
    ['min', { min: Number.NaN }],
    ['max', { max: Number.POSITIVE_INFINITY }],
    ['step', { step: Number.NaN }],
    ['value', { value: Number.NEGATIVE_INFINITY }],
  ])(
    'throws the typed configuration error for a non-finite %s',
    (_name, overrides) => {
      expect(() => renderSlider(overrides)).toThrowError(
        SliderConfigurationError,
      );
    },
  );

  it('throws when the bounds collapse, with min at or above max', () => {
    expect(() => renderSlider({ min: 300 })).toThrowError(
      SliderConfigurationError,
    );
  });

  it('throws for a non-positive step', () => {
    expect(() => renderSlider({ step: 0 })).toThrowError(
      SliderConfigurationError,
    );
  });

  it('throws when the controlled value escapes the range, rather than clamping it', () => {
    expect(() => renderSlider({ value: 500 })).toThrowError(
      SliderConfigurationError,
    );
  });

  it('does not judge step-grid alignment: an off-grid value renders untouched', () => {
    // 63 sits inside [20, 300] but off the 5-grid; alignment is the caller's obligation and the
    // native control's own conduct (stepMismatch in a surrounding form) stays observable.
    renderSlider({ value: 63 });
    expect(screen.getByRole('slider')).toHaveValue('63');
  });

  it("carries the consumer's e2e hook as data-testid", () => {
    renderSlider({ testId: 'wage-slider' });
    expect(screen.getByRole('slider')).toHaveAttribute(
      'data-testid',
      'wage-slider',
    );
  });
});
