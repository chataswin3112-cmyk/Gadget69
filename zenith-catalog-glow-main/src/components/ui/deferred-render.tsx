import { ReactNode, useEffect, useRef, useState } from "react";

interface DeferredRenderProps {
  children: ReactNode;
  placeholder?: ReactNode;
  rootMargin?: string;
  className?: string;
  onVisible?: () => void;
}

const DeferredRender = ({
  children,
  placeholder = null,
  rootMargin = "320px 0px",
  className,
  onVisible,
}: DeferredRenderProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) {
      return;
    }

    const node = containerRef.current;
    if (!node || typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      onVisible?.();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        setIsVisible(true);
        onVisible?.();
        observer.disconnect();
      },
      {
        rootMargin,
        threshold: 0.01,
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isVisible, onVisible, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : placeholder}
    </div>
  );
};

export default DeferredRender;
