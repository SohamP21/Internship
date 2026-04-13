import { useCallback, useState } from 'react';

/**
 * Multi-step form navigation (presentation only — validation stays in page handlers).
 * @param {number} totalSteps
 */
export function useStepper(totalSteps) {
  const [currentStep, setCurrentStep] = useState(0);

  const goNext = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback((index) => {
    if (index >= 0 && index < totalSteps) setCurrentStep(index);
  }, [totalSteps]);

  return {
    currentStep,
    totalSteps,
    isFirst: currentStep === 0,
    isLast: currentStep === totalSteps - 1,
    goNext,
    goBack,
    goTo,
    setStep: setCurrentStep,
  };
}
