export class MeterConfigurationError extends Error {
  constructor(reason: string) {
    super(`Meter configuration is invalid: ${reason}`);
    this.name = 'MeterConfigurationError';
  }
}
