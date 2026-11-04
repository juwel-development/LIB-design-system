import { createContext } from 'react';

// Screen's persistent remainder, not its growing fallback content. Pane reads this same box
// in both modes, so restoration never needs a temporary bound or a second render of children.
export const ScreenBodyAllocation = createContext<HTMLDivElement | null>(null);
