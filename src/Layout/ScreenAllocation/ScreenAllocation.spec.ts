import { describe, expect, it } from 'vitest';
import { ScreenAllocation } from './ScreenAllocation';

describe('Screen allocation participants', () => {
  it('rejects an unusable owner until it unregisters without affecting another screen', () => {
    const allocation = new ScreenAllocation();
    const adjacent = new ScreenAllocation();
    const unregister = allocation.register(() => false);
    expect(allocation.accepts()).toBe(false);
    expect(adjacent.accepts()).toBe(true);
    unregister();
    expect(allocation.accepts()).toBe(true);
  });

  it('invalidates on registration, content change and removal until the observer unsubscribes', () => {
    const allocation = new ScreenAllocation();
    const events: string[] = [];
    const subscription = allocation.invalidated$.subscribe(() =>
      events.push('changed'),
    );
    const unregister = allocation.register(() => true);
    allocation.invalidate();
    unregister();
    expect(events).toHaveLength(3);
    subscription.unsubscribe();
    allocation.invalidate();
    expect(events).toHaveLength(3);
  });
});
