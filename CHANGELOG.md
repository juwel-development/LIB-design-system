# [3.1.0](https://github.com/juwel-development/LIB-design-system/compare/v3.0.0...v3.1.0) (2026-08-18)


### Bug Fixes

* **figure:** treat a switched-off overlay as absent, not as a slot to wrap ([ef9ea2d](https://github.com/juwel-development/LIB-design-system/commit/ef9ea2de801d9ddc837a8916319e60d009198800))
* **form:** publish the annotation resize, and cite ADR 0004 rather than restate it ([648e976](https://github.com/juwel-development/LIB-design-system/commit/648e976808864194023bd926cc95630e4c54592a)), closes [#79](https://github.com/juwel-development/LIB-design-system/issues/79)
* **form:** size the annotations from the small type role ([b327a9f](https://github.com/juwel-development/LIB-design-system/commit/b327a9f88a79ae8f980681f6b95160fef6f4eef1)), closes [#79](https://github.com/juwel-development/LIB-design-system/issues/79)
* **form:** treat a note that renders nothing as no note ([70deb14](https://github.com/juwel-development/LIB-design-system/commit/70deb1489bdc0adf01ad4417a52e2bafd7d232cf)), closes [#86](https://github.com/juwel-development/LIB-design-system/issues/86)
* **header:** state the fill rule that actually holds, and drop the second recipe ([fb5acf6](https://github.com/juwel-development/LIB-design-system/commit/fb5acf6f1689df691be450b316e1ce3b2c6f121b))
* **interaction:** size the field, its label and the button at the body role ([38ce222](https://github.com/juwel-development/LIB-design-system/commit/38ce222d1fc308d7840730472652cccfb905a3a8))
* **review:** narrow Link's face assertion and sort note against note in ADR 0004 ([c03a801](https://github.com/juwel-development/LIB-design-system/commit/c03a80193026aa1e3605940d5ea51537b8fb0137))
* **theme:** let the button ink follow the theme so every fill clears 4.5:1 ([#93](https://github.com/juwel-development/LIB-design-system/issues/93)) ([757c932](https://github.com/juwel-development/LIB-design-system/commit/757c932a8d54dbc7715d9fd45bf49ed55b2fe642))
* **tokens:** constrain the primary and secondary fills to 3:1 against surface ([72c27fc](https://github.com/juwel-development/LIB-design-system/commit/72c27fcf5af19bc412a68eb7fab7798943ff7366)), closes [#0895d8](https://github.com/juwel-development/LIB-design-system/issues/0895d8) [#0284c7](https://github.com/juwel-development/LIB-design-system/issues/0284c7) [#78](https://github.com/juwel-development/LIB-design-system/issues/78)
* **typography:** correct Note's recorded reasoning and tighten its weight pin ([#77](https://github.com/juwel-development/LIB-design-system/issues/77)) ([8f6a5a4](https://github.com/juwel-development/LIB-design-system/commit/8f6a5a42fe47f66f84e58a9c60c3e79a0a602120))
* **typography:** declare a family face on every text-bearing element in Interaction and Form ([7aa1655](https://github.com/juwel-development/LIB-design-system/commit/7aa1655f16ce6d613279ebec90abce8c511dead7))


### chore

* publish the notes deferred from [#84](https://github.com/juwel-development/LIB-design-system/issues/84), [#87](https://github.com/juwel-development/LIB-design-system/issues/87) and [#81](https://github.com/juwel-development/LIB-design-system/issues/81) ([22f7bea](https://github.com/juwel-development/LIB-design-system/commit/22f7beae5af146e4a22165959137aef115d1ea56)), closes [#94](https://github.com/juwel-development/LIB-design-system/issues/94)


### Features

* **arrangement:** add Cluster, a wrapping baseline-aligned row ([#76](https://github.com/juwel-development/LIB-design-system/issues/76)) ([f519bbb](https://github.com/juwel-development/LIB-design-system/commit/f519bbb9c5e79ce569e53808cacc278f461f50d8))
* **arrangement:** add Stack, a measure-bounded vertical stack ([#75](https://github.com/juwel-development/LIB-design-system/issues/75)) ([6450cd6](https://github.com/juwel-development/LIB-design-system/commit/6450cd6fc7a698b03ca7ba26f6fa583522cdc641))
* **figure:** give the image frame an overlay slot ([#85](https://github.com/juwel-development/LIB-design-system/issues/85)) ([c2c8a3d](https://github.com/juwel-development/LIB-design-system/commit/c2c8a3d43a95c1bea787a357e5d91693b7860d0d))
* **form:** widen the note to a ReactNode ([47ba18a](https://github.com/juwel-development/LIB-design-system/commit/47ba18aa17c260db01bf6440bc7156678f73eda1)), closes [#86](https://github.com/juwel-development/LIB-design-system/issues/86)
* **header:** floor the standing slot at the nav's own line box ([46c4733](https://github.com/juwel-development/LIB-design-system/commit/46c4733ed1f168ec418b1e63295c99c387bcde57))
* **section:** make the section a positioning context for consumer decoration ([5cb7a2e](https://github.com/juwel-development/LIB-design-system/commit/5cb7a2ec45369edf8089de19533c7f96488df435)), closes [#84](https://github.com/juwel-development/LIB-design-system/issues/84)
* **typography:** add Note, the small annotation paragraph ([#77](https://github.com/juwel-development/LIB-design-system/issues/77)) ([1d3a5b2](https://github.com/juwel-development/LIB-design-system/commit/1d3a5b20417426cd688af281fc54ec48451c3168)), closes [#79](https://github.com/juwel-development/LIB-design-system/issues/79) [#86](https://github.com/juwel-development/LIB-design-system/issues/86) [#90](https://github.com/juwel-development/LIB-design-system/issues/90)
* **typography:** bound H1 at the display measure ([c55eba1](https://github.com/juwel-development/LIB-design-system/commit/c55eba109341d865a5ceca22da6f4b845b054632)), closes [#94](https://github.com/juwel-development/LIB-design-system/issues/94)


### NOTE

* An absolutely-positioned descendant of a `Section` (#84) that was previously
anchored to an outer ancestor now anchors to the section instead — silently, with no error.
* `H1` (#87) now carries a display measure, so an unbounded display heading becomes
bounded.
* `Header`'s standing slot (#81) gains a floor, so a shorter standing element no
longer shrinks the bar.

# [3.0.0](https://github.com/juwel-development/LIB-design-system/compare/v2.1.1...v3.0.0) (2026-08-17)


* feat(form)!: word the optional marker through a prop ([5886d8a](https://github.com/juwel-development/LIB-design-system/commit/5886d8a485996fc6c3901dbab9ce913e8dfa6f4f)), closes [#74](https://github.com/juwel-development/LIB-design-system/issues/74)


### BREAKING CHANGES

* a non-required Input or TextArea no longer renders an `optional` marker by itself.
A consumer that wants one passes `optionalLabel` with its own translated wording.

## [2.1.1](https://github.com/juwel-development/LIB-design-system/compare/v2.1.0...v2.1.1) (2026-08-16)


### Bug Fixes

* **checklist:** reshape the item marker into a chevron ([ec33105](https://github.com/juwel-development/LIB-design-system/commit/ec33105bbd06408f0bef65488b0528ce3ac1de5a)), closes [#72](https://github.com/juwel-development/LIB-design-system/issues/72)

# [2.1.0](https://github.com/juwel-development/LIB-design-system/compare/v2.0.0...v2.1.0) (2026-08-14)


### Features

* **button:** lift the primary/secondary width floor onto a token ([f593e2e](https://github.com/juwel-development/LIB-design-system/commit/f593e2e2fd95e7f638e37e3c877d94f29fdf9975)), closes [#61](https://github.com/juwel-development/LIB-design-system/issues/61)
* **form:** add reset$ to clear Input and TextArea in place ([7cfbad8](https://github.com/juwel-development/LIB-design-system/commit/7cfbad894d5670126accfd416629d9229b3073ea)), closes [#64](https://github.com/juwel-development/LIB-design-system/issues/64)
* **tokens:** add opt-in light-only and dark-only CSS exports ([5826d45](https://github.com/juwel-development/LIB-design-system/commit/5826d45a6cd2d550009b31897cd5ce9c50b4b9fd)), closes [#62](https://github.com/juwel-development/LIB-design-system/issues/62)

# [2.0.0](https://github.com/juwel-development/LIB-design-system/compare/v1.1.0...v2.0.0) (2026-08-11)


* feat(table)!: add the Table compound primitive and a rule palette role ([6e38f8a](https://github.com/juwel-development/LIB-design-system/commit/6e38f8af845980fab5c7d50ca011e8a416e1904a)), closes [#12](https://github.com/juwel-development/LIB-design-system/issues/12)
* feat(typography)!: scope the optical correction to title and above ([659a4d1](https://github.com/juwel-development/LIB-design-system/commit/659a4d1c2f192612c01bee0dba0c4a39f3cb319d)), closes [#57](https://github.com/juwel-development/LIB-design-system/issues/57)
* fix(tokens)!: collapse the per-variant focus rings to one constrained token ([ff42333](https://github.com/juwel-development/LIB-design-system/commit/ff423334711189550b1cb3626282230fd26afcfc)), closes [#4](https://github.com/juwel-development/LIB-design-system/issues/4)
* refactor(components)!: keep props interfaces local to their component ([1620ef6](https://github.com/juwel-development/LIB-design-system/commit/1620ef617d9024e1d5f32b1c9c3dedf7ae1ecc98)), closes [#36](https://github.com/juwel-development/LIB-design-system/issues/36)


### Bug Fixes

* **build:** scope vitest discovery to this tree's src ([89798fd](https://github.com/juwel-development/LIB-design-system/commit/89798fd4422fa10813ee91c73c4ed59d0efd1e37)), closes [#35](https://github.com/juwel-development/LIB-design-system/issues/35)
* **button:** draw ghost's hover underline from the underline tokens ([1f57b30](https://github.com/juwel-development/LIB-design-system/commit/1f57b3094292688b14c47c076d46897d910b0642)), closes [#52](https://github.com/juwel-development/LIB-design-system/issues/52)
* **ci:** compute the release preview without npm credentials ([69c47e5](https://github.com/juwel-development/LIB-design-system/commit/69c47e557ba80f135c30f7546e8acfe51293089a))
* **ci:** let the release preview read its own version ([9446d57](https://github.com/juwel-development/LIB-design-system/commit/9446d57d99eac1739b56f084f0f2899ad0e37311))


### Documentation

* record ILinkProps in the breaking list ([1a6ad2e](https://github.com/juwel-development/LIB-design-system/commit/1a6ad2ea7e1005b4ae340598d424c735a1dceb0b))


### Features

* **brandmark:** add the Brandmark primitive that names a consumer-supplied mark ([af5f34d](https://github.com/juwel-development/LIB-design-system/commit/af5f34d4506e360f79a644870e3cc24d40cd1f24)), closes [#16](https://github.com/juwel-development/LIB-design-system/issues/16)
* **checklist:** add the Checklist compound list and the tick dimension tokens ([45087dd](https://github.com/juwel-development/LIB-design-system/commit/45087dd90100f1d95d990ec81b7b4da695948af2)), closes [#13](https://github.com/juwel-development/LIB-design-system/issues/13)
* **definition-list:** add the DefinitionList compound primitive ([2d9acfd](https://github.com/juwel-development/LIB-design-system/commit/2d9acfdd701b70038185fac3fa44a3cc3eaaeff5)), closes [#11](https://github.com/juwel-development/LIB-design-system/issues/11)
* **eyebrow:** add the Eyebrow label primitive ([c61ee6b](https://github.com/juwel-development/LIB-design-system/commit/c61ee6bc4910138ab92a62ef98e7da2936ae4b11)), closes [#8](https://github.com/juwel-development/LIB-design-system/issues/8)
* **figure:** add the aspect-locked image frame with a focal point and caption ([7d2db88](https://github.com/juwel-development/LIB-design-system/commit/7d2db88b74d9aed4ce8a18b023d4250a3dd83571)), closes [#20](https://github.com/juwel-development/LIB-design-system/issues/20)
* **footer:** add the shell's bottom edge as a frame with one opaque slot ([d86f8aa](https://github.com/juwel-development/LIB-design-system/commit/d86f8aa8617b2a5ce8d2fd31cfb9b3fc790a4cad)), closes [#15](https://github.com/juwel-development/LIB-design-system/issues/15)
* **form:** add Input and TextArea labelled text controls ([d0f78ca](https://github.com/juwel-development/LIB-design-system/commit/d0f78ca938d8cc4be453931f640ccc45eb5f42d6)), closes [#5](https://github.com/juwel-development/LIB-design-system/issues/5)
* **form:** add the driver-agnostic Form container and a spacing token contract ([482f423](https://github.com/juwel-development/LIB-design-system/commit/482f423be2a2dac4d1830e2e7ceabd305eb13fcc)), closes [#6](https://github.com/juwel-development/LIB-design-system/issues/6)
* **header:** add the shell's top edge with a standing link and a nav ([945195e](https://github.com/juwel-development/LIB-design-system/commit/945195eeb1ebdf5650e78baf35ab3f51e2b45e8d)), closes [#14](https://github.com/juwel-development/LIB-design-system/issues/14)
* **hero:** add the first screen as a fold-height frame with one opaque slot ([99de9c0](https://github.com/juwel-development/LIB-design-system/commit/99de9c07c706ce5902c2b520b10699af92acd878)), closes [#17](https://github.com/juwel-development/LIB-design-system/issues/17)
* **link:** add graphic treatment and underline quiet on hover ([77d9329](https://github.com/juwel-development/LIB-design-system/commit/77d93291247a4aa6a9438a351eb28080e0289062)), closes [#50](https://github.com/juwel-development/LIB-design-system/issues/50)
* **link:** add the Link primitive with three treatments ([9b4c2a5](https://github.com/juwel-development/LIB-design-system/commit/9b4c2a5795bc0ce4778e4131a76dfa6f6b9426da)), closes [#7](https://github.com/juwel-development/LIB-design-system/issues/7)
* **page-head:** add the subpage head as a full-bleed title, lede and intro ([21d3abe](https://github.com/juwel-development/LIB-design-system/commit/21d3abee02851a78b8550f71e24d3fa8fabd93b0)), closes [#18](https://github.com/juwel-development/LIB-design-system/issues/18)
* **prose:** add the measure-bounded Prose reading block and a lede type role ([8c9fbfd](https://github.com/juwel-development/LIB-design-system/commit/8c9fbfd78ebe9f5c8d573974e06591876c5ed541)), closes [#21](https://github.com/juwel-development/LIB-design-system/issues/21)
* **rail:** add the sticky index column as a section filed beside its numeral ([6e98502](https://github.com/juwel-development/LIB-design-system/commit/6e98502ac7f6da5038f358a6c2b4fb3956b29c24)), closes [#19](https://github.com/juwel-development/LIB-design-system/issues/19)
* **section:** add the page's structural unit with band and gutter tokens ([9a5c925](https://github.com/juwel-development/LIB-design-system/commit/9a5c925269a93833cecf8d6ab8c79210e9beafcc)), closes [#9](https://github.com/juwel-development/LIB-design-system/issues/9)
* **tokens:** add a typography token contract of roles ([6ff2170](https://github.com/juwel-development/LIB-design-system/commit/6ff21701eba7a018e97521a1412489bbe5e65906)), closes [#29](https://github.com/juwel-development/LIB-design-system/issues/29)
* **tokens:** add the subtitle type role and correct --text-display ([eb97b71](https://github.com/juwel-development/LIB-design-system/commit/eb97b7168df16c3e253949a5fe454a49dce05442)), closes [#32](https://github.com/juwel-development/LIB-design-system/issues/32)
* **tokens:** name the control corner radius, drop hard-coded rounded-lg ([e67545a](https://github.com/juwel-development/LIB-design-system/commit/e67545a4a9ec0d954cb7c1c75dd06483f919d7d9)), closes [#3](https://github.com/juwel-development/LIB-design-system/issues/3)
* **typography:** add the H1-H6 and P text primitives ([f219ef2](https://github.com/juwel-development/LIB-design-system/commit/f219ef22a5402c44f9fa78f8bc05a049bd63a1e2)), closes [#30](https://github.com/juwel-development/LIB-design-system/issues/30)


### BREAKING CHANGES

* `--tracking-display` is renamed `--tracking-optical`. A
consumer re-pointing it in their theme must rename the declaration or
the override is silently lost.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
* `PaletteTokens` gains a required `rule` field. A consumer that
constructs its own palette object of this type must add a `rule` colour (a
mid-neutral, >=3:1 against its `surface`); spreading `light`/`dark` and overriding
is unaffected.
* `ILinkProps` is no longer exported either. Link landed on main while
the props types were being closed off, so it was missing from the list in the commit
that removed the rest. A consumer that named it should reach the shape structurally
with `ComponentProps<typeof Link>` instead.
* The component props types (`IH1Props`-`IH6Props`, `IPProps`, `IButtonProps`,
`IInputProps`, `ITextAreaProps`) are no longer exported. A consumer that named one should
reach the shape structurally with `ComponentProps<typeof Component>` instead.
* The `--color-primary-ring`, `--color-secondary-ring` and `--color-ring` tokens are
removed, replaced by `--color-focus-ring` (constraint: ≥ 3:1 against `surface`). A consumer who
still declares the old general-ring `--color-ring` has it honoured as a fallback; the two variant
rings are dropped outright. The fallback on `--color-ring` is removed in the next major.

# [1.1.0](https://github.com/juwel-development/LIB-design-system/compare/v1.0.0...v1.1.0) (2026-08-11)


### Features

* **tokens:** add a re-pointable motion duration token ([c190159](https://github.com/juwel-development/LIB-design-system/commit/c190159eaf71174a327e424e5ca53d7d820aa66e)), closes [#2](https://github.com/juwel-development/LIB-design-system/issues/2)

# [1.0.0](https://github.com/juwel-development/LIB-design-system/compare/v0.2.0...v1.0.0) (2026-08-11)


* fix(button)!: drop elevation — shadows and the press-shift ([b9ec2a8](https://github.com/juwel-development/LIB-design-system/commit/b9ec2a8c3a7394a566cbf8508a180dbf63a2bdea)), closes [#1](https://github.com/juwel-development/LIB-design-system/issues/1)


### BREAKING CHANGES

* Button's `shadow` prop is removed. Its only value, `shadow="none"`, asked
for what is now the default, so delete the prop from any call site that sets it.

# [0.2.0](https://github.com/juwel-development/LIB-design-system/compare/v0.1.2...v0.2.0) (2026-08-09)


### Features

* **button:** support submit and reset button types ([e81f197](https://github.com/juwel-development/LIB-design-system/commit/e81f197d2a707666c6195e30c6850a0acf28453b))
