import { createRequire } from 'node:module';

// The semantic-release configuration. JavaScript rather than JSON because the notes generator needs a
// `writerOpts.transform` function — see `noteTitle` below — and JSON cannot hold one. Everything else
// is the plain data it always was. `release-notes.spec.ts` pins the behaviour this file configures.
//
// **The guard.** The commit analyser and the notes generator parse every commit *independently*, each
// with its own parser options. That is what lets a `NOTE:` footer publish without bumping a major: the
// analyser's rules promote to major when a commit has any parsed note at all, and under its untouched
// default keyword list a `NOTE:` footer parses to zero notes. The consequence runs both ways — **any
// keyword added to the notes generator is invisible to versioning by construction**. A keyword that
// should affect the version must never be added here alone. Concretely: do not add the hyphenated
// `BREAKING-CHANGE` spelling, which would publish a breaking-change note while shipping a patch. If
// that spelling is ever wanted it belongs in *both* plugins' parser options, or in neither.

const require = createRequire(import.meta.url);

// The preset copy the notes generator itself loads, not whichever copy this file's own resolution
// would find. `@semantic-release/release-notes-generator` imports `conventional-changelog-angular`
// from its own tree, and that is a different version from the one hoisted to the root here (which
// belongs to commitlint). Resolving from the plugin keeps the wrapper below in lockstep with the
// transform it wraps, whatever npm does with the tree.
const presetPath = require.resolve('conventional-changelog-angular', {
  paths: [require.resolve('@semantic-release/release-notes-generator')],
});
const { writer } = await (await import(presetPath)).default();

const BREAKING_CHANGE_KEYWORDS = ['BREAKING CHANGE', 'BREAKING-CHANGE'];

// The heading a note is filed under. Verified against the installed tree: the preset the generator
// loads (`conventional-changelog-angular` 8.3.1) titles *every* note `BREAKING CHANGES`
// unconditionally, so a `NOTE:` footer would publish under a breaking-change heading on a patch
// release — the exact confusion #94 exists to remove. Version 9 of the preset does this itself, in a
// `noteTitle` this is a backport of; when the generator's copy reaches 9, this wrapper becomes a
// no-op that can be deleted, and until then it is load-bearing.
//
// Forcing the preset to 9 instead was considered and rejected: it is a nested transitive dependency,
// pinning one to change a heading silently reverts on any lockfile refresh, and 9's writer options
// are written against a newer `conventional-changelog-writer` than the generator ships.
const noteTitle = (keyword) => {
  const upperCased = keyword.toUpperCase();
  return BREAKING_CHANGE_KEYWORDS.includes(upperCased)
    ? 'BREAKING CHANGES'
    : upperCased;
};

// The preset's own transform, with the note titles put right. Everything else — the type headings,
// the commit links, the reference formatting — is the preset's, so an entry that carries no note is
// byte-for-byte what it was before this file existed. The keyword survives on the raw commit at the
// same index the transformed note sits at, which is where the title is recovered from.
const transform = (commit, context) => {
  const transformed = writer.transform(commit, context);
  if (!transformed) return transformed;

  return {
    ...transformed,
    notes: transformed.notes.map((note, index) => ({
      ...note,
      title: noteTitle(commit.notes[index]?.title ?? note.title),
    })),
  };
};

export default {
  branches: [
    {
      name: 'main',
    },
  ],
  plugins: [
    // Untouched, deliberately: this is the plugin that decides the version, and the guard above is
    // only true for as long as it stays on its defaults.
    '@semantic-release/commit-analyzer',
    [
      '@semantic-release/release-notes-generator',
      {
        // `BREAKING CHANGE` is the preset's own keyword, restated because these options replace the
        // preset's list rather than extending it.
        parserOpts: { noteKeywords: ['BREAKING CHANGE', 'NOTE'] },
        writerOpts: { transform },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    '@semantic-release/npm',
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        message:
          // biome-ignore lint/suspicious/noTemplateCurlyInString: semantic-release interpolates these itself, so they must survive as literal text.
          'chore(release): set `package.json` version to ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
