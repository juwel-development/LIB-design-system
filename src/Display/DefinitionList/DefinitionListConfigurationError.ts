export class DefinitionListConfigurationError extends Error {
  constructor(reason: string) {
    super(`DefinitionList configuration is invalid: ${reason}`);
    this.name = 'DefinitionListConfigurationError';
  }
}
