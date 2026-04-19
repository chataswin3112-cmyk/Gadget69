import { useEffect } from "react";

const STAGGER_STEP_MS = 45;
const STAGGER_MAX_MS = 180;
const DRIFT_FACTOR = 0.08;
const DRIFT_MAX = 10;
const DRIFT_DECAY = 0.86;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Watches all homepage animation targets and reveals them once on entry.
 * Visible cards can also receive a subtle scroll-linked drift through CSS vars.
 */
export function useScrollAnimations(dependencies: ReadonlyArray<number> = []) {
  const dependencyKey = dependencies.join(":");

  useEffect(() => {
    const sectionTargets = new Set<HTMLElement>();
    const cardTargets = new Set<HTMLElement>();
    const driftTargets = new Set<HTMLElement>();
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isDesktop = window.innerWidth >= 768;
    const enableDrift = !prefersReducedMotion && isDesktop;

    if (!isDesktop || prefersReducedMotion) {
      document
        .querySelectorAll<HTMLElement>("[data-animate], [data-animate-card]")
        .forEach((el) => el.classList.add("is-visible"));
      document.querySelectorAll<HTMLElement>("[data-drift]").forEach((el) => {
        el.style.setProperty("--drift-x", "0px");
        el.style.setProperty("--drift-y", "0px");
      });
      return;
    }

    let observeFrameId = 0;
    let scrollFrameId = 0;
    let driftFrameId = 0;
    let lastScrollY = window.scrollY;
    let currentDrift = 0;

    const setDrift = (el: HTMLElement, value = 0) => {
      const xRatio = Number(el.dataset.driftX ?? 0);
      const yRatio = Number(el.dataset.driftY ?? 0);
      const strength = Number(el.dataset.driftStrength ?? 1);

      el.style.setProperty("--drift-x", `${(value * xRatio * strength).toFixed(3)}px`);
      el.style.setProperty("--drift-y", `${(value * yRatio * strength).toFixed(3)}px`);
    };

    const isNearViewport = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return rect.bottom >= -96 && rect.top <= window.innerHeight + 96;
    };

    const shouldReveal = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      return rect.top <= window.innerHeight * 0.9;
    };

    const getCardDelay = (el: HTMLElement) => {
      const parent = el.parentElement;
      const attr = el.dataset.animateCard;

      if (!parent || !attr) {
        return 0;
      }

      const siblings = Array.from(
        parent.querySelectorAll<HTMLElement>(`[data-animate-card="${attr}"]`)
      );
      const index = siblings.indexOf(el);

      if (index < 0) {
        return 0;
      }

      return Math.min(index * STAGGER_STEP_MS, STAGGER_MAX_MS);
    };

    const syncDriftTargets = () => {
      if (!enableDrift) {
        driftTargets.forEach((el) => setDrift(el, 0));
        return;
      }

      driftTargets.forEach((el) => {
        if (!el.isConnected || !el.classList.contains("is-visible")) {
          setDrift(el, 0);
          driftTargets.delete(el);
          return;
        }

        if (!isNearViewport(el)) {
          setDrift(el, 0);
          return;
        }

        setDrift(el, currentDrift);
      });
    };

    const stepDrift = () => {
      currentDrift *= DRIFT_DECAY;
      syncDriftTargets();

      if (Math.abs(currentDrift) < 0.05) {
        currentDrift = 0;
        syncDriftTargets();
        driftFrameId = 0;
        return;
      }

      driftFrameId = window.requestAnimationFrame(stepDrift);
    };

    const startDriftLoop = () => {
      if (!enableDrift) {
        return;
      }

      window.cancelAnimationFrame(driftFrameId);
      driftFrameId = window.requestAnimationFrame(stepDrift);
    };

    const revealElement = (
      observer: IntersectionObserver,
      el: HTMLElement,
      delayMs = 0
    ) => {
      if (delayMs > 0) {
        el.style.setProperty("--stagger-delay", `${delayMs}ms`);
      }

      if (enableDrift && el.dataset.drift !== undefined) {
        driftTargets.add(el);
        setDrift(el, currentDrift);
      }

      el.classList.add("is-visible");
      sectionTargets.delete(el);
      cardTargets.delete(el);
      observer.unobserve(el);
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealElement(sectionObserver, entry.target as HTMLElement);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -12% 0px" }
    );

    const cardObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          revealElement(cardObserver, entry.target as HTMLElement, getCardDelay(entry.target as HTMLElement));
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -10% 0px" }
    );

    const observeAll = () => {
      if (enableDrift) {
        document
          .querySelectorAll<HTMLElement>("[data-drift].is-visible")
          .forEach((el) => driftTargets.add(el));
      }
      syncDriftTargets();

      document
        .querySelectorAll<HTMLElement>("[data-animate]:not(.is-visible)")
        .forEach((el) => {
          if (shouldReveal(el)) {
            revealElement(sectionObserver, el);
            return;
          }

          sectionTargets.add(el);
          sectionObserver.observe(el);
        });

      document
        .querySelectorAll<HTMLElement>("[data-animate-card]:not(.is-visible)")
        .forEach((el) => {
          if (shouldReveal(el)) {
            revealElement(cardObserver, el, getCardDelay(el));
            return;
          }

          cardTargets.add(el);
          cardObserver.observe(el);
        });
    };

    const syncSkippedTargets = () => {
      sectionTargets.forEach((el) => {
        if (shouldReveal(el)) {
          revealElement(sectionObserver, el);
        }
      });

      cardTargets.forEach((el) => {
        if (shouldReveal(el)) {
          revealElement(cardObserver, el, getCardDelay(el));
        }
      });
    };

    const handleViewportChange = () => {
      if (scrollFrameId) {
        return;
      }

      scrollFrameId = window.requestAnimationFrame(() => {
        scrollFrameId = 0;
        syncSkippedTargets();
        syncDriftTargets();
      });
    };

    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      const delta = nextScrollY - lastScrollY;
      lastScrollY = nextScrollY;

      handleViewportChange();

      if (!enableDrift || delta === 0) {
        return;
      }

      currentDrift = clamp(delta * DRIFT_FACTOR, -DRIFT_MAX, DRIFT_MAX);
      syncDriftTargets();
      startDriftLoop();
    };

    observeFrameId = window.requestAnimationFrame(() => {
      observeFrameId = window.requestAnimationFrame(() => {
        observeAll();
        handleViewportChange();
      });
    });

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    return () => {
      window.cancelAnimationFrame(observeFrameId);
      window.cancelAnimationFrame(scrollFrameId);
      window.cancelAnimationFrame(driftFrameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleViewportChange);
      driftTargets.forEach((el) => setDrift(el, 0));
      sectionObserver.disconnect();
      cardObserver.disconnect();
    };
  }, [dependencyKey]);
}
