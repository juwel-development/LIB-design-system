export class FigureConfigurationError extends Error {
  constructor(violation: string) {
    super(`Figure configuration: ${violation}`);
    this.name = 'FigureConfigurationError';
  }
}
