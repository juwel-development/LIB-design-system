/** Conventional Commits. semantic-release derives the next version from these messages,
 *  so the type prefix is what decides patch vs minor vs major. */
export default {
  extends: ['@commitlint/config-conventional'],
};
