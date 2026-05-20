import gsap from "gsap";

/**
 * GSAP Typewriter animation effect (Stepped text rendering character by character)
 */
export function animateTypewriter(
  element: HTMLElement | null,
  text: string,
  speed = 0.03,
  delay = 0,
  onComplete?: () => void
) {
  if (!element) return;
  element.textContent = "";
  
  const tl = gsap.timeline({ delay });
  let currentText = "";
  const chars = text.split("");
  
  chars.forEach((char) => {
    tl.to({}, {
      duration: speed,
      onStart: () => {
        currentText += char;
        element.textContent = currentText;
      }
    });
  });
  
  if (onComplete) {
    tl.eventCallback("onComplete", onComplete);
  }
  
  return tl;
}

/**
 * Stepped fade reveal (Brutalist stepped opacity reveal, no smooth curves)
 */
export function animateSteppedFade(
  element: HTMLElement | null,
  duration = 0.3,
  delay = 0,
  steps = 3
) {
  if (!element) return;
  
  gsap.set(element, { opacity: 0 });
  
  return gsap.to(element, {
    opacity: 1,
    duration,
    delay,
    ease: `steps(${steps})`,
  });
}

/**
 * Glitch snap effect (Brutalist positional shift and snap opacity)
 */
export function animateGlitchSnap(element: HTMLElement | null, delay = 0) {
  if (!element) return;
  
  const tl = gsap.timeline({ delay });
  
  tl.set(element, { opacity: 0, x: -8 })
    .to(element, { opacity: 0.7, x: 4, duration: 0.04 })
    .to(element, { opacity: 0.3, x: -2, duration: 0.03 })
    .to(element, { opacity: 1, x: 0, duration: 0.05 });
    
  return tl;
}
