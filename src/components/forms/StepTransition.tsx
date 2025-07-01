import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface StepTransitionProps {
  children: ReactNode;
  step: number;
  currentStep: number;
}

export function StepTransition({ children, step, currentStep }: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {step === currentStep && (
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
} 