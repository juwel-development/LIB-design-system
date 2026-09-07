export class ChoicesCompositionError extends Error {
  constructor(member: string) {
    super(`Choices.${member} must be composed inside Choices.Root`);
    this.name = 'ChoicesCompositionError';
  }
}
