export class ColumnLayoutConfigurationError extends Error {
  constructor(reason: string) {
    super(`ColumnLayout configuration is invalid: ${reason}`);
    this.name = 'ColumnLayoutConfigurationError';
  }
}
