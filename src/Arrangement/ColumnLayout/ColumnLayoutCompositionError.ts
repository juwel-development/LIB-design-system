export class ColumnLayoutCompositionError extends Error {
  constructor() {
    super(
      'ColumnLayout.Column must be a direct child of ColumnLayout.Root (arrays and fragments are fine; a wrapping component or a nested Column is not)',
    );
    this.name = 'ColumnLayoutCompositionError';
  }
}
