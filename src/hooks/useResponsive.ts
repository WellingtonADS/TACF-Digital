import { useEffect, useState } from "react";

function getBreakpoints() {
  if (typeof window === "undefined")
    return { isMobile: false, isTablet: false, isDesktop: true };
  const w = window.innerWidth;
  return {
    isMobile: w < 768,
    isTablet: w >= 768 && w < 1024,
    isDesktop: w >= 1024,
  };
}

export function useResponsive() {
  const [state, setState] = useState(getBreakpoints);

  useEffect(() => {
    function onResize() {
      setState(getBreakpoints());
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return state;
}

export default useResponsive;
