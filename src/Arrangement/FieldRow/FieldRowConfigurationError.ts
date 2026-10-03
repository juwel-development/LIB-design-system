export class FieldRowConfigurationError extends Error {
  constructor(violation: string) {
    super(`FieldRow configuration: ${violation}`);
    this.name = 'FieldRowConfigurationError';
  }
}
