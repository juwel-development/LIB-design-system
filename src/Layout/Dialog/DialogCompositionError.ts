export class DialogCompositionError extends Error {
  constructor(member: string) {
    super(`Dialog.${member} must be composed inside Dialog.Root`);
    this.name = 'DialogCompositionError';
  }
}
