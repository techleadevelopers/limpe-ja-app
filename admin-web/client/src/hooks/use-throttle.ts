import { useEffect, useRef, useState } from "react";

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastExecution = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    const now = Date.now();
    const timeSinceLast = now - lastExecution.current;
    const remainingTime = limit - timeSinceLast;

    if (lastExecution.current === 0 || remainingTime <= 0) {
      setThrottledValue(value);
      lastExecution.current = now;
      return;
    }

    timeoutRef.current = setTimeout(() => {
      setThrottledValue(value);
      lastExecution.current = Date.now();
      timeoutRef.current = null;
    }, remainingTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, limit]);

  return throttledValue;
}
