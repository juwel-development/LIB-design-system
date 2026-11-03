import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Callout, Cluster, Icon, P, Stack } from 'index';
import { type CSSProperties, useEffect, useState } from 'react';
import { Subject } from 'rxjs';

const meta: Meta<typeof Callout> = {
  title: 'Display/Callout',
  component: Callout,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `Callout marks consumer-owned content with a leading-edge status bar, without a four-sided box, fill, heading or imposed internal arrangement. Use Stack and Cluster inside it to arrange text and controls.

**Contract.** Props are children, tone (warning by default; also info, success and error), optional name and testId. A nonempty name exposes an accessible group; omitted or empty names leave a plain div. The name is never visible text: keep it consistent with any heading you supply. Callout adds no tab stop, keyboard handler or live announcement. Consumers own status changes and any announcement they need.

**Meaning without colour.** State the status and its consequence in visible text, or use an Icon whose label names the status and whose shape conveys it independently of colour. A tone or group name alone is not a visible status explanation. Callout supplies no wording, dismiss control or action.

**Theme contract.** The mark reads warning, info, success or error; text reads foreground and the surrounding surface remains visible. Keep the mark at least 3:1 against that surface (the shared status-tone 4.5:1 text constraint already clears this on surface). --callout-mark-width defaults to 0.25rem and must be a positive CSS length. --space-callout-inset defaults to 1em and must be a nonnegative CSS length. The latter separates the mark from the content on the leading edge only. Both are declared in every token entry point and may be re-pointed by a theme; no consumer component CSS is needed.

The logical border follows writing direction. In forced colours it uses CanvasText; the words and icon shapes still carry the status. Content retains its own keyboard operation, order and arrangement. Prose wraps in narrow holders; intrinsically wide children own their overflow. No height, clipping or scrolling is added.

Use the theme toolbar or dark stories to inspect both schemes. Enable OS/browser forced colours to inspect ForcedColours: only the leading mark remains, and both answer controls retain their keyboard focus outlines.`,
      },
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-foreground)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const ResponseExample = () => {
  const [answer, setAnswer] = useState<string>();
  const [accept] = useState(() => new Subject<void>());
  const [decline] = useState(() => new Subject<void>());
  useEffect(() => {
    const accepted = accept.subscribe(() => setAnswer('Accepted'));
    const declined = decline.subscribe(() => setAnswer('Declined'));
    return () => {
      accepted.unsubscribe();
      declined.unsubscribe();
    };
  }, [accept, decline]);
  return (
    <Callout tone={answer ? 'success' : 'warning'} name="Response">
      <Stack>
        <P>
          {answer
            ? `Response recorded: ${answer}.`
            : 'This message needs a response. It holds game time.'}
        </P>
        <Cluster gap="stack">
          <Button onClick$={accept}>Accept</Button>
          <Button variant="outlined" onClick$={decline}>
            Decline
          </Button>
        </Cluster>
      </Stack>
    </Callout>
  );
};

export const Response: Story = { render: () => <ResponseExample /> };
export const Warning: Story = {
  args: {
    tone: 'warning',
    children: <P>Warning: answer this request before continuing.</P>,
  },
};
export const Info: Story = {
  args: {
    tone: 'info',
    children: <P>Information: changes take effect at the next session.</P>,
  },
};
export const Success: Story = {
  args: {
    tone: 'success',
    children: <P>Success: your response was recorded.</P>,
  },
};
export const ErrorTone: Story = {
  args: {
    tone: 'error',
    children: <P>Error: your response could not be saved. Try again.</P>,
  },
};
export const NamedIcon: Story = {
  args: {
    tone: 'warning',
    name: 'Response',
    children: (
      <Cluster gap="stack">
        <Icon
          name="bubble-exclamation"
          label="Response required"
          color="warning"
        />
        <P>Choose an answer to continue.</P>
      </Cluster>
    ),
  },
};
export const Narrow: Story = {
  ...Warning,
  decorators: [
    (Story) => (
      <div style={{ width: '16rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};
export const RightToLeft: Story = {
  args: {
    tone: 'warning',
    name: 'תגובה נדרשת',
    children: <P>נדרשת תגובה לפני המשך המשחק.</P>,
  },
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
};
export const ThemeTokens: Story = {
  ...Warning,
  decorators: [
    (Story) => (
      <div
        style={
          {
            '--callout-mark-width': '0.5rem',
            '--space-callout-inset': '2em',
          } as CSSProperties
        }
      >
        <Story />
      </div>
    ),
  ],
};
export const ForcedColours: Story = { ...Response };
export const WarningDark: Story = { ...Warning, globals: { theme: 'dark' } };
export const InfoDark: Story = { ...Info, globals: { theme: 'dark' } };
export const SuccessDark: Story = { ...Success, globals: { theme: 'dark' } };
export const ErrorDark: Story = { ...ErrorTone, globals: { theme: 'dark' } };
export const ResponseDark: Story = { ...Response, globals: { theme: 'dark' } };
