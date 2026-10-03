import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  createContext,
  type FunctionComponent,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useRef,
} from 'react';
import { alignControlEdges, type IControlEdge } from './alignControlEdges';
import { FieldRowCompositionError } from './FieldRowCompositionError';
import { FieldRowConfigurationError } from './FieldRowConfigurationError';

// Root's one recipe: a wrapping flex row whose items sit on their line's top edge, so the padding
// the alignment pass writes on an item is the only thing that moves its control. The row gap is
// Cluster's (docs/adr/0008): along a line the two attested roles, between wrapped lines `stack`.
const fieldRowRoot = cva(
  'flex flex-wrap items-start gap-y-[var(--space-stack)]',
  {
    variants: {
      gap: {
        stack: 'gap-x-[var(--space-stack)]',
        region: 'gap-x-[var(--space-region)]',
      },
    },
    defaultVariants: { gap: 'stack' },
  },
);

// Actions' one recipe, keyed by part: the item takes its content width and never a share of the
// row, capped at the row so the group inside it wraps its buttons only once it cannot fit alone.
const fieldRowActions = cva('', {
  variants: {
    part: {
      item: 'min-w-0 max-w-full flex-none',
      group: 'flex flex-wrap items-end gap-[var(--space-stack)]',
    },
  },
  defaultVariants: { part: 'item' },
});

const TOKEN_NAME = /^--[A-Za-z0-9_-]+$/;

const ROOT_ITEMS = ':scope > [data-field-row-item]';

type FieldRowContract = {
  align: () => void;
};

const FieldRowContext = createContext<FieldRowContract | undefined>(undefined);

const useFieldRowContract = (member: string): FieldRowContract => {
  const contract = useContext(FieldRowContext);
  if (contract === undefined) {
    throw new FieldRowCompositionError(member);
  }
  return contract;
};

const assertWeight = (weight: number): void => {
  if (!(Number.isFinite(weight) && weight > 0)) {
    throw new FieldRowConfigurationError(
      `weight must be a positive finite number, got ${weight}`,
    );
  }
};

const assertTokenName = (minWidth: string): void => {
  if (!TOKEN_NAME.test(minWidth)) {
    throw new FieldRowConfigurationError(
      `minWidth must name a CSS custom property such as --search-field-min-width, got ${JSON.stringify(minWidth)}`,
    );
  }
};

// The control is whatever the field's own label labels - the association every field guarantees -
// so the alignment boundary is the field's public contract and never its box structure. A control
// positioned absolutely is drawn as the box it is positioned in: MultiSelect's trigger spans its
// field inside the border, and the border is the edge a viewer aligns.
const labelledControl = (content: Element): Element | undefined => {
  const id = content.querySelector('label[for]')?.getAttribute('for');
  const control = id ? content.ownerDocument.getElementById(id) : null;
  return control && content.contains(control) ? control : undefined;
};

const isPositioned = (element: Element): boolean =>
  getComputedStyle(element).position !== 'static';

const controlBox = (control: Element, content: Element): Element => {
  if (getComputedStyle(control).position !== 'absolute') {
    return control;
  }
  let box = control.parentElement;
  while (box !== null && box !== content && !isPositioned(box)) {
    box = box.parentElement;
  }
  return box ?? control;
};

const measure = (item: Element): IControlEdge => {
  const top = item.getBoundingClientRect().top;
  const content = item.firstElementChild;
  if (content === null) {
    return { top, controlEdge: 0 };
  }
  const contentRect = content.getBoundingClientRect();
  const control = labelledControl(content);
  const edge =
    control === undefined
      ? contentRect.bottom
      : controlBox(control, content).getBoundingClientRect().bottom;
  return { top, controlEdge: edge - contentRect.top };
};

// Reads every item's line and control edge in one pass, then writes only the paddings that
// changed: a converged row is read-only, so the observer that called this sees no further resize.
const alignItems = (root: HTMLElement): void => {
  const items = Array.from(root.querySelectorAll<HTMLElement>(ROOT_ITEMS));
  const paddings = alignControlEdges(items.map(measure));
  items.forEach((item, index) => {
    const padding = paddings[index] ?? 0;
    const current = Number.parseFloat(item.style.paddingTop) || 0;
    if (Math.abs(current - padding) > 0.01) {
      item.style.paddingTop = padding === 0 ? '' : `${padding}px`;
    }
  });
};

export interface IFieldRowRootProps extends VariantProps<typeof fieldRowRoot> {
  /** `FieldRow.Field` and `FieldRow.Actions` members, in reading order. */
  children?: ReactNode;
  testId?: string;
}

const FieldRowRoot: FunctionComponent<IFieldRowRootProps> = ({
  gap,
  children,
  testId,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | undefined>(undefined);
  const observedRef = useRef<WeakSet<Element>>(new WeakSet());

  const align = (): void => {
    if (rootRef.current) {
      alignItems(rootRef.current);
    }
  };

  // Every render re-measures before paint, and every item's content is observed from then on:
  // a label wrapping under a narrower holder or a message appearing changes the content's size,
  // never the padded item's, so the observer never sees its own write and the loop settles.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) {
      return;
    }
    alignItems(root);
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    observerRef.current ??= new ResizeObserver(() => alignItems(root));
    for (const item of root.querySelectorAll(ROOT_ITEMS)) {
      const content = item.firstElementChild;
      if (content !== null && !observedRef.current.has(content)) {
        observedRef.current.add(content);
        observerRef.current.observe(content);
      }
    }
  });

  useLayoutEffect(() => () => observerRef.current?.disconnect(), []);

  return (
    <div ref={rootRef} className={fieldRowRoot({ gap })} data-testid={testId}>
      <FieldRowContext value={{ align }}>{children}</FieldRowContext>
    </div>
  );
};

export interface IFieldRowFieldProps {
  /** One existing labelled field - `Input`, `NumberInput`, `Select`, `MultiSelect` or `TextArea`. */
  children?: ReactNode;
  /** The field's share of its row relative to the other fields on it. Positive and finite; `1`
   *  when omitted, so fields share a row equally unless one says otherwise. */
  weight?: number;
  /** The name of the consumer's theme token holding this field's minimum readable width, such as
   *  `--search-field-min-width`. A name, never a length, an expression or a `var()`. */
  minWidth: `--${string}`;
  testId?: string;
}

const FieldRowField: FunctionComponent<IFieldRowFieldProps> = ({
  children,
  weight = 1,
  minWidth,
  testId,
}) => {
  const { align } = useFieldRowContract('Field');
  assertWeight(weight);
  assertTokenName(minWidth);
  useLayoutEffect(() => align());
  return (
    <div
      data-field-row-item
      data-testid={testId}
      style={{
        flexGrow: weight,
        flexShrink: 1,
        flexBasis: '0%',
        minWidth: `min(var(${minWidth}), 100%)`,
      }}
    >
      <div data-field-row-content>{children}</div>
    </div>
  );
};

export interface IFieldRowActionsProps {
  /** The consumer's action buttons, in reading order. */
  children?: ReactNode;
  testId?: string;
}

const FieldRowActions: FunctionComponent<IFieldRowActionsProps> = ({
  children,
  testId,
}) => {
  const { align } = useFieldRowContract('Actions');
  useLayoutEffect(() => align());
  return (
    <div data-field-row-item className={fieldRowActions()} data-testid={testId}>
      <div
        data-field-row-content
        className={fieldRowActions({ part: 'group' })}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * A wrapping row of labelled fields and the shared actions that trail them, aligned on the bottom
 * edges of the controls themselves rather than on the fields' boxes - so a label that wraps, an
 * optional marker, a hint or an error on one field never pushes its neighbours' controls out of
 * line. It owns that one arrangement and nothing else: no form, no landmark, no filter meaning,
 * no wording, and no outer space. Composed from `Root`, a `Field` around each existing labelled
 * field, and `Actions` around the consumer's buttons (docs/adr/0008, Amendments).
 *
 * @Guarantees — enforced on every render
 * - `Root` renders a `div` with no role and no margin; the members render unmodified inside their
 *   items in content order, so reading and keyboard order are the content's.
 * - On each row, every control's bottom edge and the actions' bottom edge meet the deepest one.
 *   The control is the element a field's own label labels - the association every field already
 *   guarantees - so a taller control, a `TextArea` or a group of wrapped buttons keeps its height
 *   and the others come down to it. Labels, markers, hints and errors are never the anchor.
 * - Items wrap progressively at the available width of the holder, not the viewport: a row holds
 *   what fits every field's minimum, and each row aligns its controls independently. A field alone
 *   on a row narrower than its minimum fits that row rather than overflowing it.
 * - Each row's width is shared among its fields in proportion to their `weight`s - equal by
 *   default - after the gaps and the actions' content width are reserved. Minimums come from the
 *   consumer's theme tokens named by `minWidth`, resolved live, so a theme change re-wraps.
 * - The actions stay one trailing group: they move to the next row together, and their buttons
 *   wrap inside the group only once the group cannot fit on a row by itself, still in order.
 * - `gap` selects which space role separates items along a row: `stack` (the default), the
 *   sibling gap of controls that belong together, or `region`. Wrapped rows and the buttons
 *   inside the actions are always `--space-stack`, as `Cluster` fixes its wrapped lines.
 * - Reflow - a resize, a message appearing, a label changing, a field omitted or taken in - keeps
 *   every retained control mounted, with its value, selection and focus; nothing is re-keyed.
 *   Alignment is measured before paint on every render and again whenever an item's content
 *   resizes, so no frame paints a misaligned row. An omitted field reserves no space.
 * - No literal length and no numbered spacing rung appears in the recipes; a `weight` that is
 *   not a positive finite number, or a `minWidth` that is not a custom property name, throws a
 *   `FieldRowConfigurationError`, and a member outside `Root` throws a
 *   `FieldRowCompositionError`.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Every `minWidth` token is declared in the applicable theme with a nonnegative CSS length, on
 *   the row or an ancestor, in any unit including font-relative ones. An undeclared token is not a
 *   responsive configuration: the field then falls back to its content's minimum width.
 * - `Field` and `Actions` are the direct children of `Root` - through arrays, fragments and
 *   consumer components that render them, but never wrapped in an element of the consumer's own.
 * - A `Field` holds exactly one labelled field; the field keeps its label, hint, optional marker
 *   and error, and FieldRow reads none of their wording.
 * - The form, its submission and any filter meaning belong to the consumer; the actions are the
 *   consumer's `Button`s, in the consumer's words, and a filter is never a landmark by itself.
 *
 * @UXGuidelines
 * - `gap="stack"` is a filter: fields and actions that act together. `gap="region"` separates
 *   fields that are not one set.
 * - Weight a search field higher than a threshold or a select; give every field a minimum its
 *   label and placeholder can be read at, and expect the row to wrap at that width.
 * - Keep action wording short: a `Button` does not wrap its text, so a long label widens the
 *   group and wraps the row sooner.
 */
export const FieldRow = {
  Root: FieldRowRoot,
  Field: FieldRowField,
  Actions: FieldRowActions,
} as const;
