import { createRequire } from 'node:module';

// The semantic-release configuration. JavaScript rather than JSON because the notes generator's entry
// carries a `writerOpts.transform` function and JSON cannot hold one. The guard on adding a keyword
// here is architecture.md § The `NOTE:` footer, which is why the analyser's entry carries no options.
// Forcing `conventional-changelog-angular` to 9 instead of wrapping its transform was rejected:
// pinning a nested transitive reverts on any lockfile refresh, and 9's writer options target a newer
// `conventional-changelog-writer` than the generator ships. `release-notes.spec.ts` pins all of it.

const require = createRequire(import.meta.url);

// Resolved from the generator's own tree, not this file's: the plugin loads its own nested copy of
// `conventional-changelog-angular`, and the copy hoisted to the root here belongs to commitlint. This
// keeps the wrapper below in lockstep with the transform it wraps, whatever npm does with the tree.
const presetPath = require.resolve('conventional-changelog-angular', {
  paths: [require.resolve('@semantic-release/release-notes-generator')],
});
const { writer } = await (await import(presetPath)).default();

const BREAKING_CHANGE_KEYWORDS = ['BREAKING CHANGE', 'BREAKING-CHANGE'];

// The heading a note is filed under. The preset the generator loads (8.3.1, verified installed) titles
// *every* note `BREAKING CHANGES` unconditionally, so without this a `NOTE:` footer would publish under
// a breaking-change heading on a patch release. A backport of the `noteTitle` version 9 does itself;
// architecture.md § The `NOTE:` footer says how to tell when it has become a deletable no-op.
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
    // Untouched, deliberately: this is the plugin that decides the version, and the guard in
    // architecture.md § The `NOTE:` footer holds only for as long as it stays on its defaults.
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
