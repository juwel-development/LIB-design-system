export class FieldRowCompositionError extends Error {
  constructor(member: string) {
    super(`FieldRow.${member} must be composed inside FieldRow.Root`);
    this.name = 'FieldRowCompositionError';
  }
}
