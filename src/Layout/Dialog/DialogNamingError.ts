export class DialogNamingError extends Error {
  constructor() {
    super(
      'A Dialog takes exactly one accessible naming source: a visible Dialog.Title or ariaLabel on Dialog.Root, never both',
    );
    this.name = 'DialogNamingError';
  }
}
