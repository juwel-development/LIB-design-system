# #100 implementation and browser evidence

Implemented the [agreed Agent Brief](https://github.com/juwel-development/LIB-design-system/issues/100#issuecomment-5555885319), after reading the issue body and all comments (one comment at implementation time).

Stack accepts opt-in `align="start" | "center"` through its CVA-derived props. There is no default alignment: omission preserves inheritance. The implementation changes neither Cover nor existing sizing, spacing or direction recipes. Public guarantees and three stories explain block-local centring, inheritance, logical resets and split tracks.

## Validation

- TDD: the new public prop type assertion failed with TS2339 before implementation, then passed; other strings are excluded by the exact union assertion.
- Targeted Stack suite: 24 passed.
- Full suite: 36 files, 541 tests passed.
- `npm run lint`, `npm run typecheck`, `npm run build`: passed.
- Build has two warnings from unchanged `src/display-measure-site.spec.ts` comments containing `var(…)`, scanned as Tailwind candidates.
- New Storybook play assertions check line midpoint error, inherited centre through a nested Stack, LTR/RTL start resets and Table's explicit right alignment. These execute in the browser; they are not run by the jsdom Vitest command.

## Browser environment and method

Measured 2026-09-06 using Orca's embedded Chromium 150.0.7871.224 and the existing Storybook/Vite tooling (`npm run storybook -- --ci --port 6100`), which freshly compiles the library stylesheet. No browser-driver dependency was added. The separate package production build also passes.

Same-origin Storybook iframes set real viewport widths, height 844 CSS px and no iframe border. Each measurement waits for the story render/play phase to finish and `document.fonts.ready`. Geometry comes from `getBoundingClientRect()`; line boxes come from `Range.getClientRects()` over each plain-text heading/annotation. The axis is the midpoint of the receiving block. Tolerance: **0.1 CSS px**. Only the iframe harness sets a width; all alignment is expressed through Stack props, with no text-align CSS or library DOM overrides.

## Wrapped text in Cover

H1: “A place for every jar”. Note: “Every jar named, every shelf ready for the next season.” Both wrap without overlong words at every tested viewport. Default action bound is 320 CSS px; 280 tests below that bound.

| Viewport | Block width | Block/frame axis | H1 line axes | Note line axes |
|---|---:|---:|---|---|
| 1280 × 844 | 320 | 640.0 | 639.992, 640.000, 640.000 | 640.000, 639.992 |
| 390 × 844 | 320 | 195.0 | 194.992, 194.992 | 195.000, 194.992 |
| 280 × 844 | 232 | 140.0 | 139.992, 139.992 | 139.992, 140.000 |

Maximum midpoint error was 0.0078125 CSS px. At 1280 with alignment omitted, H1 axes were 613.008, 632.156 and 522.797 against the same 640 block axis, confirming the fixture detects the original gap.

## Geometry and narrower blocks

Compared every rendered div, H1, Note and Button for omitted, center and start. **Zero difference** in x, y, width, height, computed gap, flex direction or max-width, for all Cover widths above and the split-track widths below. Each role's line count also remained unchanged. This exercises the stack/action and region/unbounded combinations and nested action columns.

| Split viewport | Arrangement | First text-block axis | Second text-block axis | Outer axis |
|---|---|---:|---:|---:|
| 1280 | row | 314 | 966 | 640 |
| 1023 | column | 511.5 | 511.5 | 511.5 |
| 1024 | row | 250 | 774 | 512 |
| 280 | column | 140 | 140 | 140 |

At 1280 and 1024, each child text block retains its 320 px width and existing placement: text centres within its own track, visibly away from the outer Stack axis. At 280, blocks cap to 280 px. Every centred line remained within the stated tolerance. Split switches at 1024 in this environment; alignment does not affect the switch.

## Inheritance, resets and owned alignment

At 390 px, the InheritedAndReset story's play assertions finished successfully:

- Nested omission: computed `center`, line midpoint 195, block midpoint 195.
- LTR reset: computed `start`, direction `ltr`, line left 0 equals block left 0.
- RTL reset: computed `start`, direction `rtl`, Arabic line right 390 equals block right 390.
- Table cell: computed `right`, line right 390, retaining its explicit alignment under a centred Stack.

Every iframe's Storybook phase was `finished`, including CenteredText's line assertions at all three widths. Omitted alignment in a normal document computed to `start`.

## Reproduction

Open a Storybook iframe through `orca tab create`, then run the following expression using `orca eval --page <browserPageId> --expression <expression> --json`. It returns all 22 measurements as JSON; `!undefined` is Storybook's omitted-argument encoding. The local full output is `/tmp/ticket-100-browser-measurements.json`.

```js
(async () => {
  const results = [];
  for (const [story, widths] of [['centered-text',[1280,390,280]],['aligned-tracks',[1280,1023,1024,280]],['inherited-and-reset',[390]]]) {
    for (const width of widths) {
      for (const align of (story === 'inherited-and-reset' ? ['center'] : ['!undefined','center','start'])) {
        const frame = document.createElement('iframe');
        frame.style.cssText = `width:${width}px;height:844px;border:0;display:block`;
        frame.src = `/iframe.html?id=arrangement-stack--${story}&viewMode=story&args=align:${align}`;
        document.body.append(frame);
        await new Promise(resolve => frame.onload = resolve);
        const win = frame.contentWindow;
        const doc = frame.contentDocument;
        for(let attempt=0;attempt<200 && (!doc.querySelector('#storybook-root p') || win.__STORYBOOK_PREVIEW__?.storyRenders[0]?.phase !== 'finished');attempt++) await new Promise(resolve=>setTimeout(resolve,25));
        await doc.fonts.ready;
        if(!doc.querySelector('#storybook-root p')) throw new Error('Missing story ' + story);
        const boxes = [...doc.querySelectorAll('#storybook-root div,#storybook-root h1,#storybook-root p,#storybook-root button,#storybook-root td')].map(element=>{
          const rectangle=element.getBoundingClientRect();
          const computed=win.getComputedStyle(element);
          const range=doc.createRange();range.selectNodeContents(element);
          return {tag:element.tagName,text:element.tagName==='DIV' ? undefined : element.textContent,
            x:rectangle.x,y:rectangle.y,width:rectangle.width,height:rectangle.height,
            align:computed.textAlign,direction:computed.direction,flexDirection:computed.flexDirection,gap:computed.gap,maxWidth:computed.maxWidth,
            lines:['P','H1','TD'].includes(element.tagName)?[...range.getClientRects()].map(line=>({left:line.left,right:line.right,axis:(line.left+line.right)/2,error:(line.left+line.right-rectangle.left-rectangle.right)/2})):undefined};
        });
        results.push({story,width,align,phase:win.__STORYBOOK_PREVIEW__?.storyRenders[0]?.phase,boxes});
        frame.remove();
      }
    }
  }
  return JSON.stringify({userAgent:navigator.userAgent,tolerance:0.1,results});
})()
```

## Handoff

Implementation is ready for the separately assigned fresh code review. No push, merge, branch switch or release configuration change was performed. The coordinator owns review, landing and any subsequent publication.
