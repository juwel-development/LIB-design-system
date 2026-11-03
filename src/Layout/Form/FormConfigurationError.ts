export class FormConfigurationError extends Error {
  constructor(reason: string) {
    super(`Form configuration is invalid: ${reason}`);
    this.name = 'FormConfigurationError';
  }
}
