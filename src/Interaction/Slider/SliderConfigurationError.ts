export class SliderConfigurationError extends Error {
  constructor(violation: string) {
    super(`Slider configuration: ${violation}`);
    this.name = 'SliderConfigurationError';
  }
}
