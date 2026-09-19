import { useEffect } from 'react';

/**
 * Global horizontal scroll listener that ensures any horizontal list or carousel
 * in the entire application can be smoothly scrolled using:
 * 1. Vertical mouse wheel (converts vertical wheel delta into horizontal scroll)
 * 2. Mouse click-and-drag (drag-to-scroll with intuitive grab cursor)
 * 3. Prevents accidental card/item clicks when dragging
 *
 * Optimized for low CPU consumption: mousemove listener is only attached while dragging,
 * and style recalculation is guarded by fast geometric checks.
 */
export function useGlobalHorizontalScroll() {
  useEffect(() => {
    // 1. Mouse wheel handling
    const handleWheel = (e: WheelEvent) => {
      // If horizontal delta is dominant (e.g. trackpad horizontal swipe), let native behavior handle it
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) || e.deltaY === 0) {
        return;
      }

      let current: HTMLElement | null = e.target as HTMLElement | null;
      while (current && current !== document.body && current !== document.documentElement) {
        // Fast geometric check first before expensive getComputedStyle
        if (current.scrollWidth > current.clientWidth + 2) {
          const style = window.getComputedStyle(current);
          const overflowX = style.overflowX;

          if (overflowX === 'auto' || overflowX === 'scroll') {
            const maxScroll = current.scrollWidth - current.clientWidth;
            const goingRight = e.deltaY > 0;
            const goingLeft = e.deltaY < 0;

            if ((goingRight && current.scrollLeft < maxScroll - 1) || (goingLeft && current.scrollLeft > 1)) {
              e.preventDefault();
              current.scrollLeft += e.deltaY;
              return;
            }
          }
        }
        current = current.parentElement;
      }
    };

    // 2. Global mouse drag-to-scroll for horizontal containers
    let activeContainer: HTMLElement | null = null;
    let startX = 0;
    let initialScrollLeft = 0;
    let hasDragged = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!activeContainer) return;

      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 4) {
        if (!hasDragged) {
          hasDragged = true;
          activeContainer.style.userSelect = 'none';
          document.body.style.cursor = 'grabbing';
        }
        activeContainer.scrollLeft = initialScrollLeft - deltaX;
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      if (!activeContainer) return;

      if (hasDragged) {
        activeContainer.style.userSelect = '';
        document.body.style.cursor = '';
        // Retain hasDragged briefly to intercept the click event
        setTimeout(() => {
          hasDragged = false;
          activeContainer = null;
        }, 60);
      } else {
        activeContainer = null;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only primary mouse button

      let current: HTMLElement | null = e.target as HTMLElement | null;
      while (current && current !== document.body && current !== document.documentElement) {
        if (current.scrollWidth > current.clientWidth + 2) {
          const style = window.getComputedStyle(current);
          const overflowX = style.overflowX;

          if (overflowX === 'auto' || overflowX === 'scroll') {
            activeContainer = current;
            startX = e.clientX;
            initialScrollLeft = current.scrollLeft;
            hasDragged = false;

            // Only attach move and up listeners when an active draggable container is engaged
            window.addEventListener('mousemove', handleMouseMove, { passive: true });
            window.addEventListener('mouseup', handleMouseUp);
            return;
          }
        }
        current = current.parentElement;
      }
    };

    const handleClickCapture = (e: MouseEvent) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousedown', handleMouseDown, true);
    window.addEventListener('click', handleClickCapture, true);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousedown', handleMouseDown, true);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClickCapture, true);
      if (activeContainer) {
        activeContainer.style.userSelect = '';
        document.body.style.cursor = '';
      }
    };
  }, []);
}
