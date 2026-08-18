// The shape `release-notes.spec.ts` reads off `.releaserc.js`. The config is JavaScript because
// semantic-release loads it itself and its notes-generator entry carries a function, so without this
// the import is an implicit `any`.
declare const config: {
  plugins: (string | [string, Record<string, unknown>])[];
};

export default config;
