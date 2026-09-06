export class TabsCompositionError extends Error {
  constructor(member: string) {
    super(`Tabs.${member} must be composed inside Tabs.Root`);
    this.name = 'TabsCompositionError';
  }
}
