import { useEffect, useState } from "react";

export function useResponsive(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false,
  );

  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < breakpoint);
    }

    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return { isMobile };
}

export default useResponsive;
