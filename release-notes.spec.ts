// Pins the release-notes half of `.releaserc.js` — the `NOTE:` footer convention (#94) — by running
// the real semantic-release plugins over commit messages, not by asserting on the config object. The
// mechanism only works because the two plugins parse each commit independently, so a test that reads
// the config would prove nothing about either. Both plugins are exercised here: the notes generator
// for what a note publishes, the commit analyser for what it does *not* bump.
//
// This spec sits at the repo root beside the config it pins, the way a component spec sits beside its
// component. `vitest.config.ts` includes it explicitly.

// @ts-expect-error - @semantic-release/commit-analyzer ships no type declarations.
import { analyzeCommits as untypedAnalyzeCommits } from '@semantic-release/commit-analyzer';
// @ts-expect-error - @semantic-release/release-notes-generator ships no type declarations.
import { generateNotes as untypedGenerateNotes } from '@semantic-release/release-notes-generator';
import { describe, expect, it } from 'vitest';
// @ts-expect-error - the release config is JavaScript because semantic-release loads it itself and
// its notes-generator entry carries a function, which JSON cannot hold.
import releaseConfig from './.releaserc.js';

type PluginContext = {
  cwd: string;
  env: Record<string, string>;
  options: { repositoryUrl: string };
  lastRelease: { gitHead: string; gitTag: string; version: string };
  nextRelease: {
    gitHead: string;
    gitTag: string;
    version: string;
    channel: null;
  };
  commits: ReturnType<typeof commit>[];
  logger: { log: () => void };
};

const analyzeCommits = untypedAnalyzeCommits as (
  pluginConfig: object,
  context: PluginContext,
) => Promise<string | null>;
const generateNotes = untypedGenerateNotes as (
  pluginConfig: object,
  context: PluginContext,
) => Promise<string>;

type PluginEntry = string | [string, Record<string, unknown>];
const plugins = (releaseConfig as { plugins: PluginEntry[] }).plugins;

const optionsOf = (name: string): Record<string, unknown> => {
  const entry = plugins.find(
    (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === name,
  );
  if (entry === undefined)
    throw new Error(`${name} is not configured in .releaserc.js`);
  return Array.isArray(entry) ? entry[1] : {};
};

const notesOptions = optionsOf('@semantic-release/release-notes-generator');
const analyzerOptions = optionsOf('@semantic-release/commit-analyzer');

// One commit, spelled the way semantic-release hands it to a plugin: the raw message plus the fields
// the writer reads off the commit rather than out of the message.
const commit = (message: string) => ({
  hash: '1234567890abcdef1234567890abcdef12345678',
  message,
  committerDate: '2026-08-18',
  author: { name: 'Someone' },
  committer: { name: 'Someone' },
  subject: message.split('\n')[0] as string,
});

const contextFor = (
  ...commits: ReturnType<typeof commit>[]
): PluginContext => ({
  cwd: process.cwd(),
  env: {},
  options: {
    repositoryUrl: 'https://github.com/juwel-development/LIB-design-system',
  },
  lastRelease: { gitHead: 'a'.repeat(40), gitTag: 'v3.0.0', version: '3.0.0' },
  nextRelease: {
    gitHead: 'b'.repeat(40),
    gitTag: 'v3.0.1',
    version: '3.0.1',
    channel: null,
  },
  commits,
  logger: { log: () => {} },
});

const plainFix = commit(
  'fix(button): stop the focus ring clipping\n\nA body line nobody reads.\n',
);
const fixWithNote = commit(
  'fix(section): give the section a positioning context\n\nNOTE: An absolutely-positioned descendant now anchors to the section (#84).\n',
);
const featWithNote = commit(
  'feat(h1): bound the display heading\n\nNOTE: H1 now carries a display measure.\n',
);
const breakingFix = commit(
  'fix(theme): rename the surface token\n\nBREAKING CHANGE: `--surface` is now `--surface-base`.\n',
);
// The shape the convention prescribes, and the shape the catch-up commit for #84, #87 and #81 uses:
// a blank line between notes, and a note free to wrap. Neither is cosmetic — consecutive wrapped
// notes with no blank line between them silently lose one, so the separation is pinned here.
const choreWithThreeNotes = commit(
  'chore(release-notes): publish the deferred notes\n\nNOTE: One (#84), whose text runs\nonto a second line.\n\nNOTE: Two (#87).\n\nNOTE: Three (#81).\n',
);

describe('release notes', () => {
  it('publishes a NOTE: footer under its own heading, so a consumer-facing note reaches the changelog', async () => {
    const notes = await generateNotes(notesOptions, contextFor(fixWithNote));

    expect(notes).toContain('### NOTE');
    expect(notes).toContain(
      'An absolutely-positioned descendant now anchors to the section (#84).',
    );
  });

  it('keeps that note out of the breaking-change section, which is the whole point of the keyword', async () => {
    const notes = await generateNotes(notesOptions, contextFor(fixWithNote));

    expect(notes).not.toContain('BREAKING');
  });

  it('renders a commit that carries no footer exactly as the stock generator does, so the keyword changes nothing else', async () => {
    const configured = await generateNotes(notesOptions, contextFor(plainFix));
    const stock = await generateNotes({}, contextFor(plainFix));

    expect(configured).toBe(stock);
  });

  it('still files a BREAKING CHANGE: footer under BREAKING CHANGES, so a real breaking change is never disguised', async () => {
    const notes = await generateNotes(notesOptions, contextFor(breakingFix));

    expect(notes).toContain('### BREAKING CHANGES');
    expect(notes).toContain('`--surface` is now `--surface-base`.');
  });

  it('publishes every NOTE: footer of a commit that carries several, which is how a batch of deferred notes is cleared', async () => {
    const notes = await generateNotes(
      notesOptions,
      contextFor(choreWithThreeNotes),
    );

    expect(notes).toContain('### NOTE');
    expect(notes).toContain('One (#84), whose text runs\nonto a second line.');
    expect(notes).toContain('Two (#87).');
    expect(notes).toContain('Three (#81).');
  });
});

describe('the version a note produces', () => {
  it('is a patch for a fix: commit carrying a note, so a note costs no more than its commit type', async () => {
    expect(await analyzeCommits(analyzerOptions, contextFor(fixWithNote))).toBe(
      'patch',
    );
  });

  it('is a minor for a feat: commit carrying a note', async () => {
    expect(
      await analyzeCommits(analyzerOptions, contextFor(featWithNote)),
    ).toBe('minor');
  });

  it('is no release at all for a chore: commit carrying notes, so the catch-up commit rides along instead of bumping', async () => {
    expect(
      await analyzeCommits(analyzerOptions, contextFor(choreWithThreeNotes)),
    ).toBeNull();
  });

  it('is still a major for a BREAKING CHANGE: footer, so the one keyword that must bump still bumps', async () => {
    expect(await analyzeCommits(analyzerOptions, contextFor(breakingFix))).toBe(
      'major',
    );
  });
});

describe('the guard on the notes generator', () => {
  // A keyword added to the notes generator is invisible to the analyser by construction, so any
  // breaking-change spelling added here would publish a breaking note while shipping a patch. The
  // hyphenated spelling is the one that would slip through unnoticed: the parser accepts it, and
  // nothing else in this repo would fail.
  it('carries no breaking-change spelling the analyser cannot see', () => {
    const { noteKeywords } = notesOptions.parserOpts as {
      noteKeywords: string[];
    };

    expect(noteKeywords).not.toContain('BREAKING-CHANGE');
    expect(noteKeywords).toContain('BREAKING CHANGE');
  });

  it('leaves the commit analyser with no parser options at all, so nothing here can reach the version', () => {
    expect(analyzerOptions).toEqual({});
  });
});
