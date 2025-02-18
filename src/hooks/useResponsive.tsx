import { useState, useEffect, useRef, Ref } from "react";

const defaultBreakpointCategories = {
  smallMobile: {
    width: 480,
    height: 700,
  },
  mobile: {
    width: 640,
    height: 800,
  },
  tablet: {
    width: 1024,
    height: 900,
  },
  largeTablet: {
    width: 1280,
    height: 1000,
  },
  desktop: {},
} as const;

/**
 * Modes for handling resize events.
 */
type ResizeMode = "observer" | "debounce" | "once";

/**
 * Breakpoint definitions for categorizing responsive states.
 */
type BreakpointCategories = {
  [category: string]: {
    width?: number;
    height?: number;
  };
};

/**
 * Breakpoint object defining width and/or height thresholds.
 */
interface Breakpoint {
  width?: number;
  height?: number;
}

/**
 * Configuration options and parameters for the useResponsive hook.
 */
interface UseResponsiveParams<BPC extends BreakpointCategories> {
  /**
   * The listener to monitor. Can be a Ref to an HTMLElement, an HTMLElement, or a ResizeObserver.
   * If not provided, the hook will monitor the window size by default.
   */
  listener?: Ref<HTMLElement> | HTMLElement | ResizeObserver;

  /**
   * Breakpoint thresholds for width and/or height.
   */
  breakpoint?: Breakpoint;

  /**
   * Mode for handling resize events. Defaults to 'observer'.
   */
  mode?: ResizeMode;

  /**
   * Debounce delay in milliseconds. Applicable only when mode is 'debounce'.
   * Defaults to 300ms.
   */
  debounceMs?: number;

  /**
   * If true, the hook will stop observing once any breakpoint condition is met.
   * Defaults to false.
   */
  stopAfterBreak?: boolean;

  /**
   * Enables verbose logging for debugging purposes.
   * Defaults to false.
   */
  debug?: boolean;

  /**
   * Defines categories based on breakpoint conditions (e.g., 'mobile', 'tablet', 'desktop').
   * @example
   * ```tsx
   * useResponsive({
   *   breakpoint: { width: 768 },
   *   breakpointCategories: {
   *     mobile: {
   *       minWidth: 640;
   *       maxWidth: 768;
   *       minHeight: 640;
   *       maxHeight: 768;
   *       }
   *     }
   *   });
   * ```
   */
  breakpointCategories?: BPC;
}

/**
 * The object returned by the useResponsive hook.
 */
interface ResponsiveState<BPC extends BreakpointCategories> {
  isWidthBroken: boolean;
  isHeightBroken: boolean;
  width: number;
  height: number;
  breakpointCategory?: keyof BPC;
}

/**
 * useResponsive Hook
 *
 * Monitors the size of the window or a specific element and determines if it crosses specified breakpoints.
 *
 * @param params - An object containing all necessary parameters and configurations.
 *
 * @returns An object containing the current size, breakpoint status, and optional category.
 *
 * @example
 * ```tsx
 * const { isWidthBroken, width } = useResponsive({
 *   listener: ref,
 *   breakpoint: { width: 768 },
 *   mode: 'debounce',
 *   debounceMs: 300,
 *   debug: true,
 * });
 * ```
 */
export default function useResponsive<BPC extends BreakpointCategories = typeof defaultBreakpointCategories>({
  listener,
  breakpoint,
  mode = "observer",
  debounceMs = 300,
  stopAfterBreak = false,
  debug = false,
  breakpointCategories = defaultBreakpointCategories as unknown as BPC,
}: UseResponsiveParams<BPC> = {}): ResponsiveState<BPC> {
  const [state, setState] = useState<ResponsiveState<BPC>>({
    isWidthBroken: false,
    isHeightBroken: false,
    width: 0,
    height: 0,
    breakpointCategory: undefined,
  });

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Utility function for logging when debug is enabled
  const debuggingLog = (...args: any[]) => {
    if (debug) {
      console.log("[useResponsive]", ...args);
    }
  };

  // Function to determine breakpoint category
  const determineCategory = (width: number, height: number): keyof BPC | undefined => {
    if (!breakpointCategories || Object.keys(breakpointCategories).length === 0) return undefined;

    for (const [category, { height: conditionHeight, width: conditionWidth }] of Object.entries(
      breakpointCategories
    ).sort(([_, { height: heightA, width: widthA }], [__, { height: heightB, width: widthB }]) => {
      heightA = heightA === undefined ? 0 : heightA;
      widthA = widthA === undefined ? 0 : widthA;
      heightB = heightB === undefined ? 0 : heightB;
      widthB = widthB === undefined ? 0 : widthB;

      return heightB + widthB - heightA + widthA;
    })) {
      const widthCondition = conditionWidth === undefined || width <= conditionWidth;
      const heightCondition = conditionHeight === undefined || height <= conditionHeight;

      if (widthCondition && heightCondition) return category;
    }

    return undefined;
  };

  // Function to update the state based on current size
  const updateState = (width: number, height: number) => {
    const isWidthBroken = breakpoint?.width !== undefined ? width < breakpoint.width : false;
    const isHeightBroken = breakpoint?.height !== undefined ? height < breakpoint.height : false;
    const breakpointCategory = determineCategory(width, height);

    if (
      state.height !== height ||
      state.width !== width ||
      state.breakpointCategory !== breakpointCategory ||
      state.isHeightBroken !== isHeightBroken ||
      state.isWidthBroken !== isWidthBroken
    )
      setState({
        isWidthBroken,
        isHeightBroken,
        width,
        height,
        breakpointCategory,
      });

    debuggingLog("Updated state:", { isWidthBroken, isHeightBroken, width, height, breakpointCategory });

    // If stopAfterBreak is enabled and any breakpoint condition is met, disconnect the observer or remove the event listener
    if (stopAfterBreak && (isWidthBroken || isHeightBroken)) {
      disconnect();
      debuggingLog("Stopped observing after breakpoint was broken.");
    }
  };

  // Handler for ResizeObserver resize events
  const handleResizeObserver = (entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      updateState(width, height);
    }
  };

  // Handler for window resize events
  const handleWindowResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    updateState(width, height);
  };

  // Function to disconnect the observer or remove the event listener
  const disconnect = () => {
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
      debuggingLog("Disconnected ResizeObserver.");
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
      debuggingLog("Cleared debounce timeout.");
    }
    if (isWindowTarget.current) {
      window.removeEventListener("resize", handleWindowResize);
      debuggingLog("Removed window resize event listener.");
    }
  };

  // Ref to track if the target is Window
  const isWindowTarget = useRef<boolean>(false);

  useEffect(() => {
    let target: Element | Window | null = null;

    // Determine the target element to observe
    if (listener instanceof ResizeObserver) {
      // If a ResizeObserver instance is passed
      resizeObserverRef.current = listener;
      target = window; // Default to window for ResizeObserver (though not standard)
      isWindowTarget.current = true; // This is not ideal; reconsider
      debuggingLog("Received a ResizeObserver instance.");
    } else if (listener && "current" in listener) {
      // If a Ref is passed
      if (listener.current) {
        target = listener.current;
        isWindowTarget.current = false;
        debuggingLog("Listening to a Ref's current element.");
      } else {
        // If the ref is not yet attached to an element
        debuggingLog("Listener ref is not attached to any element.");
        return;
      }
    } else if (listener instanceof HTMLElement) {
      // If an HTMLElement is passed
      target = listener;
      isWindowTarget.current = false;
      debuggingLog("Listening to an HTMLElement.");
    } else {
      // Default to window
      target = window;
      isWindowTarget.current = true;
      debuggingLog("No listener provided. Listening to window.");
    }

    if (!target) {
      debuggingLog("No valid target to observe.");
      return;
    }

    // Initial size setup
    const getInitialSize = () => {
      if (target === window) {
        return { width: window.innerWidth, height: window.innerHeight };
      } else {
        const rect = (target as Element).getBoundingClientRect();
        return { width: rect.width, height: rect.height };
      }
    };

    const initialSize = getInitialSize();
    updateState(initialSize.width, initialSize.height);

    // Resize handling based on mode
    if (target === window) {
      // Handle Window resize
      if (mode === "observer" || mode === "debounce") {
        if (mode === "debounce") {
          const debouncedResizeHandler = () => {
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = setTimeout(() => {
              handleWindowResize();
            }, debounceMs);
          };
          window.addEventListener("resize", debouncedResizeHandler);
          debuggingLog(`Listening to window resize with debounce (${debounceMs}ms).`);

          // Cleanup debounce handler
          return () => {
            window.removeEventListener("resize", debouncedResizeHandler);
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
              debounceTimeoutRef.current = null;
            }
            debuggingLog("Cleaned up window resize event listener with debounce.");
          };
        } else {
          // 'observer' mode for Window: Use window resize event without debounce
          window.addEventListener("resize", handleWindowResize);
          debuggingLog("Listening to window resize with observer mode.");

          // Cleanup window resize event listener
          return () => {
            window.removeEventListener("resize", handleWindowResize);
            debuggingLog("Cleaned up window resize event listener.");
          };
        }
      }

      if (mode === "once") {
        // 'once' mode for Window: Already handled by initial size check
        debuggingLog("Mode is once. No further listening for window.");
      }
    } else {
      // Handle Element resize using ResizeObserver
      if (mode === "observer" || mode === "debounce") {
        if (resizeObserverRef.current === null) {
          resizeObserverRef.current = new ResizeObserver(mode === "debounce" ? () => {} : handleResizeObserver);
        }

        if (mode === "debounce") {
          const debouncedResizeHandler = (entries: ResizeObserverEntry[]) => {
            if (debounceTimeoutRef.current) {
              clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = setTimeout(() => {
              handleResizeObserver(entries);
            }, debounceMs);
          };
          const observer = new ResizeObserver(debouncedResizeHandler);
          resizeObserverRef.current = observer;
          observer.observe(target as Element);
          debuggingLog(`Observing element with ResizeObserver in debounce mode (${debounceMs}ms).`);
        } else {
          resizeObserverRef.current.observe(target as Element);
          debuggingLog("Observing element with ResizeObserver in observer mode.");
        }
      }

      if (mode === "once") {
        // 'once' mode for Element: Already handled by initial size check
        debuggingLog("Mode is once. No further observing for element.");
      }
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      disconnect();
      debuggingLog("Cleaned up observers and event listeners.");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listener, breakpoint?.width, breakpoint?.height, mode, debounceMs, stopAfterBreak, breakpointCategories]);

  return state;
}

useResponsive.defaultBreakpointCategories = defaultBreakpointCategories;