import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const getIsMobileSnapshot = () =>
  typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobileSnapshot);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(getIsMobileSnapshot());
    };
    mql.addEventListener("change", onChange);
    setIsMobile(getIsMobileSnapshot());
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
