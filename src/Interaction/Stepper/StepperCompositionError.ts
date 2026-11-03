export class StepperCompositionError extends Error {
  constructor(member: string) {
    super(`Stepper.${member} must be composed inside Stepper.Root`);
    this.name = 'StepperCompositionError';
  }
}
