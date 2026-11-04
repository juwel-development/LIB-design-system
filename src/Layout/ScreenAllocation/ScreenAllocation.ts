import { Subject } from 'rxjs';

/** Private opt-in contract: Screen owns trials; scroll owners assess only their own viewport.
 * One instance per Screen isolates registrations. No participant imports a sibling's internals.
 */
export class ScreenAllocation {
  private readonly participants = new Set<() => boolean>();
  private readonly changes$ = new Subject<void>();
  readonly invalidated$ = this.changes$.asObservable();

  register(assess: () => boolean): () => void {
    this.participants.add(assess);
    this.invalidate();
    return () => {
      this.participants.delete(assess);
      this.invalidate();
    };
  }

  accepts(): boolean {
    return Array.from(this.participants).every((assess) => assess());
  }

  invalidate = (): void => {
    this.changes$.next();
  };
}
