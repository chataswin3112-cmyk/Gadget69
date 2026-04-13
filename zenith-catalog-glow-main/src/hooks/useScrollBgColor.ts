import { useEffect } from "react";

/**
 * Scroll-triggered page background color transitions.
 * Each section with [data-bg-color] attribute gets a unique pastel bg
 * that smoothly fades in as the section scrolls into mid-viewport.
 */

// Smooth CSS transition is handled via a <style> tag injected once
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

// Pastel / light colour palette — user-requested: yellow, blue, orange, sky blue, lavender
export const SECTION_BG_COLORS = [
  "#fefce8", // 🟡 Soft Yellow
  "#dbeafe", // 🔵 Light Blue
  "#ffedd5", // 🟠 Warm Orange
  "#e0f2fe", // 🩵 Sky Blue
  "#f3e8ff", // 💜 Lavender
  "#fef9c3", // 🌼 Buttercup Yellow
  "#bfdbfe", // 💙 Cornflower Blue
  "#fed7aa", // 🍑 Peach Orange
] as const;

export function useScrollBgColor(dependencies: unknown[] = []) {
  useEffect(() => {
    injectTransitionStyle();

    const defaultBg = "#faf9f7"; // site's base paper background
    let rafId = 0;

    const getSections = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-bg-color]")
      );

    const updateBg = () => {
      const sections = getSections();
      const viewportMid = window.innerHeight * 0.45; // 45% from top

      let activeBg = defaultBg;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        // Activate when section covers the mid-viewport line
        if (rect.top <= viewportMid && rect.bottom >= viewportMid) {
          activeBg = section.dataset.bgColor ?? defaultBg;
          break;
        }
      }

      // Apply to both html and body for full-bleed effect
      document.body.style.backgroundColor = activeBg;
      document.documentElement.style.backgroundColor = activeBg;
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updateBg();
      });
    };

    // Run once on mount
    updateBg();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(rafId);
      // Reset on unmount
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
