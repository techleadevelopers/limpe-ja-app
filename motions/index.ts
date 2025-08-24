// path: src/motion/index.ts
// ---------------------------------------------
export * from './tokens';
export * from './provider/MotionProvider';
export * from '../hooks/useFadeIn';
export * from '../hooks/useScalePress';
export * from '../hooks/useStaggerList';
export * from '../hooks/useCountUp';
export * from '../hooks/useAccordion';
export * from './components/AnimatedPressable';
export * from './components/AnimatedSection';
export * from './components/AnimatedSkeleton';


// =============================================
// Quick Usage Example (paste into any screen)
// ---------------------------------------------
// import { MotionProvider, AnimatedSection, AnimatedPressable, useCountUp, useStaggerList } from '@/motion';
//
// function EarningsHeader() {
// const { display } = useCountUp({ from: 0, to: 12750.35, formatter: (n) => `R$ ${n.toFixed(2)}` });
// return (
// <AnimatedSection delay={80}>
// <Text style={{ fontSize: 22, fontWeight: '700' }}>{display}</Text>
// </AnimatedSection>
// );
// }
//
// function QuickAction({ label, index }: { label: string; index: number }) {
// const { getDelay } = useStaggerList({ baseDelay: 120, itemStep: 60 });
// return (
// <AnimatedSection delay={getDelay(index)}>
// <AnimatedPressable onPress={() => {}} style={{ padding: 16, backgroundColor: '#4A90E2', borderRadius: 16 }}>
// <Text style={{ color: 'white', fontWeight: '600' }}>{label}</Text>
// </AnimatedPressable>
// </AnimatedSection>
// );
// }
//
// export default function AppShell() {
// return (
// <MotionProvider>
// <EarningsHeader />
// <View style={{ flexDirection: 'row', gap: 12 }}>
// <QuickAction label="Agenda" index={0} />
// <QuickAction label="Ganhos" index={1} />
// <QuickAction label="Suporte" index={2} />
// </View>
// </MotionProvider>
// );
// }
// =============================================