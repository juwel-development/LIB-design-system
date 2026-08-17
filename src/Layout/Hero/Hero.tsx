import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Not pinned against Stack (#75): the fold height is this component's own, so the base legitimately
// differs and an equality spec would only forbid a difference that is the point of the component.
// One recipe on a plain <div>. It holds the fold - a minimum height taller than its content, so leftover
// space is guaranteed and how the slot sits in it is a decision, not a default (#17). With no className
// escape hatch, whatever place picks is final, so it is a variant: center is the conventional hero and the
// default; between drops a poster's foot on the fold's bottom edge; start asks for the minimum height
// without the centring. `end` is deliberately absent - content pinned to the bottom over empty space is
// not a hero. It reads --fold-height for the floor and --space-stack for the gap Prose and PageHead use.
const hero = cva(
  'flex flex-col min-h-[var(--fold-height)] gap-[var(--space-stack)]',
  {
    variants: {
      place: {
        start: 'justify-start',
        center: 'justify-center',
        between: 'justify-between',
      },
    },
    defaultVariants: { place: 'center' },
  },
);

export interface IHeroProps extends VariantProps<typeof hero> {
  /** The fold's one opaque slot. Rendered unmodified: a poster composes a mark, an `H1` lead and a foot
   *  here; another brand composes something else. `Hero` imposes no anatomy. */
  children: ReactNode;
  testId?: string;
}

/**
 * The first screen's frame: a plain container that holds at least the fold height and places one opaque
 * slot within it. It renders no heading and no landmark - a hero's lead is an `<H1>` the consumer places
 * in the slot, and the `Section` around it owns the region, the bleed, the band and the gutter. A hero
 * varies in its structure where a footer varies only in its contents, so there is no shared anatomy to
 * model and the opaque slot is the honest answer.
 *
 * @Guarantees — enforced on every render
 * - It is at least `--fold-height` tall and never taller by construction: a `min-height` floor, not a
 *   fixed height, so content longer than the fold grows the frame rather than overflowing it.
 * - `children` render unmodified; the component adds nothing to and strips nothing from them, and sets no
 *   margin, max-width, colour or heading of its own.
 * - It owns no bleed, band or gutter and emits no `<section>` and no landmark role - the enclosing
 *   `Section` carries those.
 * - `place` positions the slot in the leftover space: `center` (the default), `start` or `between`; the
 *   parts are gapped with `--space-stack`.
 * - It is never sticky or fixed and needs no JavaScript, so it renders identically server-side.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - The hero sits inside a `Section` - `<Section bleed="full"><Hero>…</Hero></Section>` - which owns the
 *   bleed, the band, the gutter and the region. `Hero` imports no component and adds none of these.
 *
 * @UXGuidelines
 * - The lead is capped at `--measure-display`, and `H1` is what carries the cap - place one in the slot
 *   and the bound comes with it (#87). The slot itself stays uncapped, because capping it would cap the
 *   mark too. Measured on the lockup that prompted this: at 24ch a one-sentence lead set five lines and
 *   became a second block competing with the mark; at 36ch, where the token sits, it sets three and reads
 *   as the mark's caption. This is the one place where copy length is a layout parameter - a hero whose
 *   lead sentence can vary in length has its measure re-pointed against the real sentence, not against a
 *   rule of thumb.
 * - A hero built on a wide lockup is a desktop bet by construction. A 15-character lockup can only be as
 *   wide as the phone, so at 390px the scale contrast between mark and lead is capped by the viewport
 *   rather than chosen - roughly 2:1, against roughly 6:1 at 1440.
 */
export const Hero: FunctionComponent<IHeroProps> = ({
  place,
  children,
  testId,
}) => (
  <div className={hero({ place })} data-testid={testId}>
    {children}
  </div>
);
