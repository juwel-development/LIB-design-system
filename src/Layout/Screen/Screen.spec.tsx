import { act, fireEvent, render, screen } from '@testing-library/react';
import {
  Box,
  ColumnLayout,
  Pane,
  ScrollContainer,
  Stack,
  Stepper,
  Table,
  Tabs,
} from 'index';
import type { ReactNode } from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Screen } from './Screen';

type Geometry = { top: number; height: number };

// jsdom lays nothing out: the remainder (the box directly inside main) and every element named by
// test id - or wrapping only such an element - answer the given geometry; the rest are empty.
const layOut = (remainder: Geometry, boxes: Record<string, Geometry>): void => {
  const named = (element: Element | null): Geometry | undefined =>
    boxes[element?.getAttribute('data-testid') ?? ''];
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const sole = this.childElementCount === 1 ? this.firstElementChild : null;
      const box =
        this.parentElement?.tagName === 'MAIN' && this.tagName !== 'HEADER'
          ? remainder
          : (named(this) ?? named(sole) ?? { top: 0, height: 0 });
      return { ...box, bottom: box.top + box.height } as DOMRect;
    },
  );
};

const isReleased = (): boolean =>
  screen.getByRole('main').querySelector('[data-screen-unusable]') !== null;

const resizeWindow = (): void => {
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

const filled = (first: ReactNode, second: ReactNode): ReactNode => (
  <ColumnLayout.Root fill>
    <ColumnLayout.Column weight={2} minWidth="--main">
      {first}
    </ColumnLayout.Column>
    <ColumnLayout.Column weight={1} minWidth="--support">
      {second}
    </ColumnLayout.Column>
  </ColumnLayout.Root>
);

const roster = (
  <Pane.Root testId="roster">
    <Pane.Head testId="roster-head">Roster</Pane.Head>
    <Pane.Body ariaLabel="Roster entries" testId="roster-body">
      Entries
    </Pane.Body>
  </Pane.Root>
);

describe('Screen', () => {
  afterEach(() => vi.restoreAllMocks());
  it('supplies one main with the consumer heading before its content', () => {
    render(
      <Screen heading={<h1>Workspace</h1>} testId="workspace">
        <button type="button">Choose</button>
      </Screen>,
    );
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('data-testid', 'workspace');
    expect(main).not.toHaveAttribute('tabindex');
    expect(
      screen
        .getByRole('heading')
        .compareDocumentPosition(screen.getByRole('button')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
  it('keeps the same focused input and selection through every absent heading form', () => {
    const { rerender } = render(
      <Screen heading={<h1>Workspace</h1>}>
        <input aria-label="Search" defaultValue="written" />
      </Screen>,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    fireEvent.change(input, { target: { value: 'retained text' } });
    input.setSelectionRange(2, 6);
    for (const heading of [
      undefined,
      null,
      false,
      <h1 key="heading">Again</h1>,
    ]) {
      rerender(
        <Screen heading={heading}>
          <input aria-label="Search" defaultValue="written" />
        </Screen>,
      );
      expect(screen.getByRole('textbox')).toBe(input);
      expect(input).toHaveFocus();
      expect(input).toHaveValue('retained text');
      expect([input.selectionStart, input.selectionEnd]).toEqual([2, 6]);
    }
  });
  it('accepts a heading inside the panel without a second heading region', () => {
    render(
      <Screen>
        <Pane.Root>
          <Pane.Head>
            <h1>Entries</h1>
          </Pane.Head>
          <Pane.Body ariaLabel="Entries">
            <button type="button">Choose</button>
          </Pane.Body>
        </Pane.Root>
      </Screen>,
    );
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('main').children).toHaveLength(1);
  });
  it.each([undefined, null, false])(
    'reserves no heading region for %s',
    (heading) => {
      render(
        <Screen heading={heading}>
          <p>Content</p>
        </Screen>,
      );
      expect(screen.getByRole('main').children).toHaveLength(1);
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    },
  );
  it('does not infer the output of a custom heading component', () => {
    const Empty = () => null;
    render(
      <Screen heading={<Empty />}>
        <p>Content</p>
      </Screen>,
    );
    expect(screen.getByRole('main').children).toHaveLength(2);
  });
  it.each([
    ['keeps its bound for', 400, false],
    ['grows the whole content for', 401, true],
  ])(
    '%s sole content-height content %ipx tall in a 400px remainder',
    (_, height, released) => {
      layOut({ top: 100, height: 400 }, { profile: { top: 100, height } });
      render(
        <Screen heading={<h1>Profile</h1>}>
          <Stack testId="profile">Facts</Stack>
        </Screen>,
      );
      expect(isReleased()).toBe(released);
    },
  );
  it('treats an unbounded Table as content-height content of its own', () => {
    layOut({ top: 0, height: 400 }, { markets: { top: 0, height: 480 } });
    render(
      <Screen>
        <Table.Root caption="Markets" testId="markets">
          <Table.Body>
            <Table.Row>
              <Table.Cell>Market</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Screen>,
    );
    expect(isReleased()).toBe(true);
  });
  it('restores the bound when the remainder grows back, measuring the same boxes in both modes', () => {
    const remainder = { top: 0, height: 300 };
    layOut(remainder, { profile: { top: 0, height: 360 } });
    render(
      <Screen>
        <Stack testId="profile">
          <input aria-label="Note" defaultValue="written" />
        </Stack>
      </Screen>,
    );
    const input = screen.getByRole('textbox') as HTMLInputElement;
    input.focus();
    input.setSelectionRange(1, 4);
    expect(isReleased()).toBe(true);
    remainder.height = 360;
    resizeWindow();
    expect(isReleased()).toBe(false);
    remainder.height = 359;
    resizeWindow();
    expect(isReleased()).toBe(true);
    expect(screen.getByRole('textbox')).toBe(input);
    expect(input).toHaveFocus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4]);
  });
  it.each([
    ['keeps its bound while', 380, false],
    ['grows the whole content once', 420, true],
  ])(
    '%s a content-height column beside a bounded pane fits the filled height',
    (_, height, released) => {
      layOut(
        { top: 0, height: 400 },
        {
          roster: { top: 0, height: 400 },
          'roster-body': { top: 40, height: 5000 },
          person: { top: 0, height },
        },
      );
      render(
        <Screen>{filled(roster, <Stack testId="person">Facts</Stack>)}</Screen>,
      );
      expect(isReleased()).toBe(released);
    },
  );
  it('does not release for long content that a bounded body, scroll container or table scrolls', () => {
    layOut(
      { top: 0, height: 400 },
      {
        roster: { top: 0, height: 9000 },
        scroller: { top: 0, height: 9000 },
        bounded: { top: 0, height: 9000 },
      },
    );
    render(
      <Screen>
        {filled(
          roster,
          <ScrollContainer ariaLabel="Log" testId="scroller">
            Log
          </ScrollContainer>,
        )}
        <Table.Root bounded caption="Rows" testId="bounded">
          <Table.Body>
            <Table.Row>
              <Table.Cell>Row</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Screen>,
    );
    expect(isReleased()).toBe(false);
  });
  it('counts a Stack holding a Box and an unsized summary pane as one content-height region', () => {
    layOut(
      { top: 0, height: 400 },
      { focus: { top: 0, height: 430 }, summary: { top: 300, height: 10 } },
    );
    render(
      <Screen>
        {filled(
          roster,
          <Stack testId="focus">
            <Box>Focus</Box>
            <Pane.Root testId="summary">
              <Pane.Head>Contract</Pane.Head>
              <Pane.Body ariaLabel="Facts">One line of facts</Pane.Body>
            </Pane.Root>
          </Stack>,
        )}
      </Screen>,
    );
    expect(isReleased()).toBe(true);
  });
  it.each([
    ['keeps its bound for', 300, false],
    ['grows the whole content for', 410, true],
  ])(
    '%s a %ipx column head above the arrangement it bounds',
    (_, height, released) => {
      layOut({ top: 0, height: 400 }, { strip: { top: 0, height } });
      render(
        <Screen>
          <ColumnLayout.Root fill>
            <ColumnLayout.Column weight={1} minWidth="--roster">
              {roster}
            </ColumnLayout.Column>
            <ColumnLayout.Column
              weight={3}
              minWidth="--detail"
              head={<p data-testid="strip">Artist · Contract facts</p>}
            >
              <ColumnLayout.Alternatives fill>
                <ColumnLayout.Root fill>
                  <ColumnLayout.Column weight={1} minWidth="--lane">
                    <Pane.Root testId="lanes">
                      <Pane.Body ariaLabel="Songs">Songs</Pane.Body>
                    </Pane.Root>
                  </ColumnLayout.Column>
                </ColumnLayout.Root>
              </ColumnLayout.Alternatives>
            </ColumnLayout.Column>
          </ColumnLayout.Root>
        </Screen>,
      );
      expect(isReleased()).toBe(released);
    },
  );
  it('passes through filling Tabs and Stepper panels to the content inside them', () => {
    layOut({ top: 0, height: 400 }, { result: { top: 60, height: 400 } });
    render(
      <Screen>
        {filled(
          <Tabs.Root
            fill
            active="songs"
            onSelect$={new Subject<string>()}
            label="Views"
          >
            <Tabs.List>
              <Tabs.Tab value="songs">Songs</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="songs">{roster}</Tabs.Panel>
          </Tabs.Root>,
          <Stepper.Root
            active$={new BehaviorSubject('terms')}
            onSelect$={new Subject<string>()}
            label="Steps"
          >
            <Stepper.List>
              <Stepper.Step
                value="terms"
                label="Terms"
                status="open"
                valueText=""
              />
            </Stepper.List>
            <Stepper.Panel value="terms">
              <Stack testId="result">Signed</Stack>
            </Stepper.Panel>
          </Stepper.Root>,
        )}
      </Screen>,
    );
    expect(isReleased()).toBe(true);
  });
  it('ignores content taken out of flow, such as an open floating layer', () => {
    layOut({ top: 0, height: 400 }, { layer: { top: 0, height: 900 } });
    render(
      <Screen>
        <div data-testid="layer" style={{ position: 'fixed' }}>
          Layer
        </div>
        <Stack testId="facts">Facts</Stack>
      </Screen>,
    );
    expect(isReleased()).toBe(false);
  });
});
