import { useRef, useEffect, useCallback, useState } from "react";

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface SwipeState {
  isDragging: boolean;
  offset: number;
}

export function useSwipe<T extends HTMLElement = HTMLElement>(options: SwipeOptions) {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 80, // Increased threshold for more resistance
    enabled = true,
  } = options;

  const ref = useRef<T>(null);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isDragging: false,
    offset: 0,
  });

  // Refs for tracking
  const startX = useRef<number>(0);
  const currentOffset = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isAnimatingRef = useRef<boolean>(false);
  const hasMoved = useRef<boolean>(false);

  // Damping factor - higher = more resistance (0.3 = 30% of actual movement)
  const dampingFactor = 0.4;
  const maxOffset = 120;

  const updateOffset = useCallback((offset: number, isDragging: boolean) => {
    currentOffset.current = offset;
    setSwipeState({ isDragging, offset });
  }, []);

  const animateToZero = useCallback(() => {
    const animate = () => {
      const current = currentOffset.current;
      if (Math.abs(current) < 1) {
        updateOffset(0, false);
        isAnimatingRef.current = false;
        return;
      }
      // Smooth spring back
      const newOffset = current * 0.85;
      updateOffset(newOffset, false);
      requestAnimationFrame(animate);
    };
    isAnimatingRef.current = true;
    requestAnimationFrame(animate);
  }, [updateOffset]);

  const triggerSwipe = useCallback((direction: 'left' | 'right') => {
    // Animate out then trigger callback
    const targetOffset = direction === 'left' ? -200 : 200;
    let current = currentOffset.current;
    
    const animateOut = () => {
      const diff = targetOffset - current;
      current += diff * 0.3;
      
      if (Math.abs(targetOffset - current) < 10) {
        // Trigger the callback
        if (direction === 'left') {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
        // Reset immediately
        updateOffset(0, false);
        isAnimatingRef.current = false;
        return;
      }
      
      updateOffset(current, false);
      requestAnimationFrame(animateOut);
    };
    
    isAnimatingRef.current = true;
    requestAnimationFrame(animateOut);
  }, [onSwipeLeft, onSwipeRight, updateOffset]);

  const startDrag = useCallback((clientX: number) => {
    if (!enabled || isAnimatingRef.current) return;
    
    isDraggingRef.current = true;
    hasMoved.current = false;
    startX.current = clientX;
    currentOffset.current = 0;
    
    setSwipeState({ isDragging: true, offset: 0 });
  }, [enabled]);

  const moveDrag = useCallback((clientX: number) => {
    if (!isDraggingRef.current || isAnimatingRef.current) return;
    
    const rawDiff = clientX - startX.current;
    
    if (Math.abs(rawDiff) > 5) {
      hasMoved.current = true;
    }
    
    // Apply damping for resistance feel
    let dampedOffset = rawDiff * dampingFactor;
    
    // Apply rubber-band effect at edges
    if (Math.abs(dampedOffset) > maxOffset) {
      const overflow = Math.abs(dampedOffset) - maxOffset;
      const dampedOverflow = overflow * 0.2;
      dampedOffset = (dampedOffset > 0 ? 1 : -1) * (maxOffset + dampedOverflow);
    }
    
    updateOffset(dampedOffset, true);
  }, [updateOffset, dampingFactor, maxOffset]);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    const finalOffset = currentOffset.current;
    
    // Check if swipe should trigger
    if (hasMoved.current && Math.abs(finalOffset) > threshold * dampingFactor) {
      if (finalOffset < 0) {
        triggerSwipe('left');
      } else {
        triggerSwipe('right');
      }
    } else {
      // Spring back to center
      animateToZero();
    }
  }, [threshold, dampingFactor, triggerSwipe, animateToZero]);

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;

    // Touch events
    const handleTouchStart = (e: TouchEvent) => {
      startDrag(e.touches[0].clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      moveDrag(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      endDrag();
    };

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [role="button"]')) {
        return;
      }
      e.preventDefault();
      startDrag(e.clientX);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        moveDrag(e.clientX);
      }
    };

    const handleMouseUp = () => {
      endDrag();
    };

    // Wheel events for trackpad
    let wheelAccumulator = 0;
    let wheelTimeout: ReturnType<typeof setTimeout>;
    
    const handleWheel = (e: WheelEvent) => {
      if (isAnimatingRef.current) return;
      
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 5) {
        e.preventDefault();
        
        wheelAccumulator += e.deltaX;
        
        // Show visual feedback with damping
        const dampedOffset = -wheelAccumulator * 0.15;
        updateOffset(
          Math.max(-maxOffset, Math.min(maxOffset, dampedOffset)),
          true
        );
        
        clearTimeout(wheelTimeout);
        wheelTimeout = setTimeout(() => {
          if (Math.abs(wheelAccumulator) > threshold) {
            if (wheelAccumulator > 0) {
              triggerSwipe('left');
            } else {
              triggerSwipe('right');
            }
          } else {
            animateToZero();
          }
          wheelAccumulator = 0;
        }, 150);
      }
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: true });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    element.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("wheel", handleWheel);
      clearTimeout(wheelTimeout);
    };
  }, [enabled, startDrag, moveDrag, endDrag, threshold, triggerSwipe, animateToZero, updateOffset, maxOffset]);

  return { ref, swipeState };
}
