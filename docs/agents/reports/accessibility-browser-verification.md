# Accessibility browser evidence — tickets 130, 131, 136

Result: PASS for the three requested browser evidence gaps; no confirmed product bug found.

## Tested source and method

- Repository: juwel-development/LIB-design-system, primary checkout on main.
- Tested commit: `737628aab2ad03b1876319fafc225a38cc5159cd`.
- Initial inspection saw `9e36a84bb33ea44689196122b8d6b28caed8f03a`; coordinator merges advanced main before snapshot creation. All results below belong to the recorded 737628a snapshot, not the initial commit.
- Read `docs/agents/reports/130-implementation.md`, `131-review.md`, and `136-review.md`.
- Exported main with git archive to `/tmp/design-system-a11y-source`; reused existing node_modules and built Storybook into `/tmp/design-system-a11y-storybook`. Verified component and stylesheet bytes against the recorded commit. Build succeeded; log: `/tmp/design-system-a11y-build.log`.
- Used already installed Playwright and actual Google Chrome 156.0.8078.80, headless, 900×650 viewport. No packages installed. Served the snapshot locally on 127.0.0.1:6149.
- Browser-native media emulation set `forcedColors: active` and light/dark `colorScheme`. Every forced-colour page asserted `matchMedia('(forced-colors: active)').matches === true`; normal button pages asserted false. Dark runs also reported the dark colour-scheme query true and Storybook's dark class.
- Playwright `page.keyboard.press('Tab')` supplied trusted browser input; every measured keyboard sequence recorded `KeyboardEvent.isTrusted === true`. No DOM dispatchEvent or programmatic focus was used to obtain the measured focus. Existing story play functions ran first; their simulated key history was cleared before our trusted-input measurements.
- Script: `/tmp/design-system-a11y-verify.mjs`; complete measured rectangles, computed styles, media state, and key events: `/tmp/design-system-a11y-results.json`. All 14 scenario runs passed assertions.

## #130 — Button variant link

`interaction-button--inline-action`, first Ana Carter action: trusted Tab focused the native button with `:focus-visible === true` in normal light/dark and forced-colour light/dark modes. The action retained its underline. Its rectangle was x=163.203125, y=16, width=94, height=28; the ring extends 5px beyond each side (3px outline + 2px offset) and is visibly unclipped.

| Mode | Outline width/style | Outline colour | Offset |
| --- | --- | --- | --- |
| Normal light | 3px solid | rgb(71, 85, 105) | 2px |
| Normal dark | 3px solid | rgb(203, 213, 225) | 2px |
| Forced light | 3px solid | rgba(5, 0, 73, 0.8) | 2px |
| Forced dark | 3px solid | rgba(0, 230, 255, 0.8) | 2px |

Screenshots: `/tmp/a11y-button-{light,dark}-{normal,forced}.png`. Inspected normal-light and forced-dark screenshots: visible complete outline around the underlined inline action. The trusted-keyboard focus appearance gap is closed for Chrome.

## #131 — Callout forced colours and control focus

`display-callout--forced-colours`, both palettes: the Response group's leading mark computed to **4px solid**, black in forced light and white in forced dark (CanvasText treatment), with transparent background and visible overflow. Rectangle x=16, y=16, width=868, height=78.6875. The mark, warning words, and both controls remain visible; no surrounding Callout box appears.

Trusted Tab reached Accept then Decline. Each matched `:focus-visible`, with a **3px solid outline and 2px offset**, using the forced palette outline colours in the table above. Accept measured x=36, y=51.1875, 168×43.5; Decline x=212, y=52.1875, 168×41.5. Both retained 1px control borders, and screenshots show the focus outline beyond the controls without clipping. Trusted Enter on Decline updated the consumer text to `Response recorded: Declined.` in both palettes.

Screenshots: `/tmp/a11y-callout-{light,dark}-{Accept,Decline}.png`. Inspected light Accept and dark Decline images. Actual forced-colour rendering and control-focus evidence gaps are closed for Chrome.

## #136 — selected Table rows in forced colours

Checked all four stories in both forced palettes:

| Story | Selected marker height | Selected row height |
| --- | --- | --- |
| highlighted-selection | 59.5px | 60.5px |
| highlighted-compact-allocation | 30.5px | 31.5px |
| highlighted-without-activation | 38.5px | 39.5px |
| selected-without-activation (default marker treatment) | 38.5px | 39.5px |

Every selected row retained `aria-selected=true` and a generated first-cell `::before` with empty-string content, **2px solid leading border**, top=0 and bottom=0. The marker fills the cell height (the row also has its 1px top rule). It was black on white in forced light and white on black in forced dark. Every unselected row had no generated marker and a 0px marker border.

The highlighted fill became the system Canvas colour (white or black), visually the same canvas as the other rows. Selection still remained visible through the vertical 2px marker: this is verified non-colour selection evidence, rather than reliance on the ordinary theme's selectedSurface.

In both interactive stories, their play function had selected Kestrel; our trusted Tab sequence focused Nova independently. Nova showed a visible **3px solid outline with 2px offset**, while Kestrel kept its selection marker. Trusted Enter selected Nova and its 2px marker appeared while focus remained. Screenshots record the marker before our focus, separate focus and selection, and their coexistence after activation.

Screenshots: `/tmp/a11y-table-{light,dark}-{highlighted-selection,highlighted-compact-allocation,highlighted-without-activation,selected-without-activation}.png`; interactive stories additionally have `-marker.png` and `-separate-focus.png`. Inspected light compact after activation, dark compact separate-focus, and light noninteractive highlighted screenshots: marker and focus visibly survive, with no clipping at the checked viewport. The forced-colour browser evidence gap is closed for Chrome.

## Limits and repository state

This verifies Chrome's genuine forced-colour rendering through browser media emulation, not a Windows OS high-contrast desktop, every custom system palette, or other browser engines. The measured link-button focus case is the inline lede action; no exhaustive narrow-width/focus geometry audit was performed. The Callout fixture is the warning Response example (and its success response after activation), not an exhaustive visual matrix of all tones. Existing publication and other acceptance items outside these three evidence gaps remain outside this read-only dispatch.

No tracked files were edited, no branch was switched, and no commits, pushes, publication, issue changes, or helper agents were used. Primary main was clean at the final check and remained at the tested commit. Temporary script/build/evidence files are under /tmp. No product fix is proposed because no genuine defect was found in this verification.
