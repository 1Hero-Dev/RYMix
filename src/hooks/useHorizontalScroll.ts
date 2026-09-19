import { useRef, useState, useEffect, useCallback } from 'react';

interface UseHorizontalScrollOptions {
  step?: number;
  enableWheel?: boolean;
  enableDrag?: boolean;
}

export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseHorizontalScrollOptions = {}
) {
  const { step = 280, enableWheel = true, enableDrag = true } = options;
  const ref = useRef<T | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    // 3px tolerance for rounding
    setCanScrollLeft(scrollLeft > 3);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 3);
  }, []);

  const scrollBy = useCallback((delta: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }, []);

  const scrollLeftBy = useCallback(() => {
    scrollBy(-step);
  }, [scrollBy, step]);

  const scrollRightBy = useCallback(() => {
    scrollBy(step);
  }, [scrollBy, step]);

  // Wheel event listener to allow horizontal scrolling with vertical mouse wheel
  useEffect(() => {
    const el = ref.current;
    if (!el || !enableWheel) return;

    const handleWheel = (e: WheelEvent) => {
      // If user is already scrolling horizontally (e.g. trackpad with deltaX), let it happen naturally
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        updateScrollState();
        return;
      }

      if (e.deltaY === 0) return;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return;

      const goingRight = e.deltaY > 0;
      const goingLeft = e.deltaY < 0;

      // Only prevent default and scroll horizontally if we haven't reached the end
      if ((goingRight && el.scrollLeft < maxScroll - 1) || (goingLeft && el.scrollLeft > 1)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        updateScrollState();
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [enableWheel, updateScrollState]);

  // Drag-to-scroll with mouse
  useEffect(() => {
    const el = ref.current;
    if (!el || !enableDrag) return;

    let isDown = false;
    let startX = 0;
    let initialScrollLeft = 0;
    let hasDragged = false;

    const onMouseDown = (e: MouseEvent) => {
      // Only left mouse button
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX - el.offsetLeft;
      initialScrollLeft = el.scrollLeft;
      setIsDragging(false);

      window.addEventListener('mousemove', onMouseMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const currentX = e.pageX - el.offsetLeft;
      const walk = currentX - startX;

      if (Math.abs(walk) > 4) {
        if (!hasDragged) {
          hasDragged = true;
          setIsDragging(true);
        }
        e.preventDefault();
        el.scrollLeft = initialScrollLeft - walk;
        updateScrollState();
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (!isDown) return;
      isDown = false;
      if (hasDragged) {
        // Briefly delay resetting dragging flag so click handlers can check it
        setTimeout(() => {
          setIsDragging(false);
          hasDragged = false;
        }, 60);
      } else {
        setIsDragging(false);
      }
      updateScrollState();
    };

    const onClickCapture = (e: MouseEvent) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('click', onClickCapture, true);

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('click', onClickCapture, true);
    };
  }, [enableDrag, updateScrollState]);

  // Listen to native scroll and resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateScrollState();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [updateScrollState]);

  return {
    ref,
    canScrollLeft,
    canScrollRight,
    scrollLeftBy,
    scrollRightBy,
    scrollBy,
    isDragging,
    updateScrollState,
  };
}
