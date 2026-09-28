export class MultiSelectCompositionError extends Error {
  constructor(member: string) {
    super(`MultiSelect.${member} must be composed inside MultiSelect.Root`);
    this.name = 'MultiSelectCompositionError';
  }
}
