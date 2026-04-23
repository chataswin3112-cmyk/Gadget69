type IdleCallback = () => void;

type IdleWindow = Window & {
  cancelIdleCallback?: (handle: number) => void;
  requestIdleCallback?: (
    callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
    options?: { timeout?: number }
  ) => number;
};

const isTestRuntime = import.meta.env.MODE === "test";

export const scheduleIdleTask = (callback: IdleCallback, timeout = 800) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (isTestRuntime) {
    callback();
    return () => {};
  }

  const idleWindow = window as IdleWindow;

  if (typeof idleWindow.requestIdleCallback === "function") {
    const handle = idleWindow.requestIdleCallback(() => {
      callback();
    }, { timeout });

    return () => {
      idleWindow.cancelIdleCallback?.(handle);
    };
  }

  const handle = window.setTimeout(callback, Math.min(timeout, 200));
  return () => {
    window.clearTimeout(handle);
  };
};

export const scheduleAfterPaint = (callback: IdleCallback, delayMs = 0) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  if (isTestRuntime) {
    callback();
    return () => {};
  }

  let timeoutHandle = 0;
  const frameHandle = window.requestAnimationFrame(() => {
    timeoutHandle = window.setTimeout(callback, delayMs);
  });

  return () => {
    window.cancelAnimationFrame(frameHandle);
    if (timeoutHandle) {
      window.clearTimeout(timeoutHandle);
    }
  };
};
