import { useEffect } from "react";

/**
 * Scroll-triggered page background color transitions.
 * Sections marked with [data-bg-color] take over the page background as they
 * cross the upper-middle viewport line.
 */

const BG_TRANSITION_ID = "scroll-bg-transition-style";

const injectTransitionStyle = () => {
  if (document.getElementById(BG_TRANSITION_ID)) return;

  const style = document.createElement("style");
  style.id = BG_TRANSITION_ID;
  style.textContent = `
    body, html {
      transition:
        background-color 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94),
        background-image 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94) !important;
    }
  `;
  document.head.appendChild(style);
};

// Light pastel palette only: yellow, blue, orange, sky, lavender, mint, blush, peach.
export const SECTION_BG_COLORS = [
  "#fefce8",
  "#dbeafe",
  "#ffedd5",
  "#e0f2fe",
  "#f3e8ff",
  "#dcfce7",
  "#fce7f3",
  "#fed7aa",
] as const;

export function useScrollBgColor(dependencies: unknown[] = []) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
      return;
    }

    injectTransitionStyle();

    const defaultBg = "#faf9f7";
    let rafId = 0;
    let observedDocumentHeight = 0;
    let sections: HTMLElement[] = [];

    const refreshSections = () => {
      sections = Array.from(document.querySelectorAll<HTMLElement>("[data-bg-color]"));
      observedDocumentHeight = document.documentElement.scrollHeight;
    };

    const updateBg = () => {
      const viewportMid = window.innerHeight * 0.45;
      let activeBg = defaultBg;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= viewportMid && rect.bottom >= viewportMid) {
          activeBg = section.dataset.bgColor ?? defaultBg;
          break;
        }
      }

      document.body.style.backgroundColor = activeBg;
      document.documentElement.style.backgroundColor = activeBg;
    };

    const onScroll = () => {
      if (rafId) return;

      rafId = window.requestAnimationFrame(() => {
        rafId = 0;

        if (document.documentElement.scrollHeight !== observedDocumentHeight) {
          refreshSections();
        }

        updateBg();
      });
    };

    const onResize = () => {
      refreshSections();
      onScroll();
    };

    refreshSections();
    updateBg();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.cancelAnimationFrame(rafId);
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
