export class DialogFrameError extends Error {
  constructor() {
    super(
      'Dialog.Root placement="frame" requires a Shell with modalScope="body" ancestor',
    );
    this.name = 'DialogFrameError';
  }
}
