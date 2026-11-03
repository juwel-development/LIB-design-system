import { describe, expect, it } from 'vitest';
import { renderTokens } from './renderTokens';

const expressionFor = (role: string): string => {
  const expression = renderTokens().match(
    new RegExp(`--text-${role}: (clamp\\([^;]+\\));`),
  )?.[1];
  if (!expression) throw new Error(`Missing clamp for ${role}`);
  return expression;
};

const sizeAt = (expression: string, viewport: number): number => {
  const match = expression.match(
    /^clamp\(([\d.]+)rem, (?:([\d.]+)rem \+ )?([\d.]+)vw, ([\d.]+)rem\)$/,
  );
  if (!match) throw new Error(`Unsupported clamp: ${expression}`);
  const floor = Number(match[1]) * 16;
  const preferred =
    Number(match[2] ?? 0) * 16 + (Number(match[3]) * viewport) / 100;
  const ceiling = Number(match[4]) * 16;
  return Math.min(ceiling, Math.max(floor, preferred));
};

const roles = ['display', 'title', 'subtitle', 'dialog-title'] as const;

describe('fluid type zoom growth', () => {
  it.each(
    roles.flatMap((role) =>
      [1280, 1440, 1920].map((viewport) => [role, viewport] as const),
    ),
  )(
    'grows %s physically by at least 1.5x at 200%% zoom from %ipx',
    (role, viewport) => {
      const expression = expressionFor(role);
      const ratio =
        sizeAt(expression, viewport / 2) / sizeAt(expression, viewport);
      expect(ratio).toBeGreaterThanOrEqual(0.75);
    },
  );

  it.each([
    ['display', 89.6],
    ['title', 64],
    ['subtitle', 36],
    ['dialog-title', 36],
  ] as const)(
    'keeps %s within 2px of its previous size at 1280px',
    (role, previous) => {
      expect(
        Math.abs(sizeAt(expressionFor(role), 1280) - previous),
      ).toBeLessThanOrEqual(2);
    },
  );

  it('keeps dialog title equal to subtitle while preserving independent roles', () => {
    expect(expressionFor('dialog-title')).toBe(expressionFor('subtitle'));
  });
});
