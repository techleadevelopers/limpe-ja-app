// path: src/motion/hooks/useStaggerList.ts
// ---------------------------------------------
export type StaggerConfig = { baseDelay?: number; itemStep?: number };


export function useStaggerList({ baseDelay = 60, itemStep = 40 }: StaggerConfig = {}) {
const getDelay = (index: number) => baseDelay + index * itemStep;
return { getDelay } as const;
}