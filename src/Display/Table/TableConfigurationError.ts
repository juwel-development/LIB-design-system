export class TableConfigurationError extends Error {
  constructor(reason: string) {
    super(`Table configuration is invalid: ${reason}`);
    this.name = 'TableConfigurationError';
  }
}
