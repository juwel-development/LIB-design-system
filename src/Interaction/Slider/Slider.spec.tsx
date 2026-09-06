import { fireEvent, render, screen } from '@testing-library/react';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

const renderSlider = (
  overrides: Partial<Parameters<typeof Slider>[0]> = {},
) => {
  const onChange$ = new Subject<number>();
  const { container } = render(
    <Slider
      min={20}
      max={300}
      step={5}
      value={60}
      onChange$={onChange$}
      label={'Weekly Wage in $'}
      {...overrides}
    />,
  );
  return { onChange$, container };
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

  it('emits the new value as a number on every change through its Subject', () => {
    const { onChange$ } = renderSlider();
    const handleChange = vi.fn();
    onChange$.subscribe(handleChange);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '65' } });
    expect(handleChange).toHaveBeenCalledWith(65);
  });

  it('renders no text of its own: no value display, no min/max captions', () => {
    const { container } = renderSlider({ valueText: '$60 a week' });
    expect(container.textContent).toBe('');
  });

  it("carries the consumer's e2e hook as data-testid", () => {
    renderSlider({ testId: 'wage-slider' });
    expect(screen.getByRole('slider')).toHaveAttribute(
      'data-testid',
      'wage-slider',
    );
  });
});
