import { createContext } from 'react';
import type { ScreenAllocation } from './ScreenAllocation';

export const ScreenAllocationContext = createContext<
  ScreenAllocation | undefined
>(undefined);
