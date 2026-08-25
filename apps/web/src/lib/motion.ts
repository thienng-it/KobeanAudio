/**
 * KobeanAudio Studio - Unified Motion & Physics Design System
 * Apple Silicon HIG & Linear-inspired spring physics and transition tokens.
 */

import { TargetAndTransition, Transition } from "framer-motion";

// Standard Spring Physics Curves
export const SPRINGS = {
  // Ultra-responsive, snappy micro-interactions (buttons, pills, tabs)
  snappy: {
    type: "spring",
    stiffness: 500,
    damping: 32,
    mass: 0.8,
  } as Transition,

  // Smooth popovers, dropdowns & drawers
  popover: {
    type: "spring",
    stiffness: 420,
    damping: 30,
    mass: 0.9,
  } as Transition,

  // Cinematic modals & large sheet reveals
  modal: {
    type: "spring",
    stiffness: 380,
    damping: 28,
    mass: 1.0,
  } as Transition,

  // Fluid layout animations & reordering
  layout: {
    type: "spring",
    stiffness: 460,
    damping: 34,
  } as Transition,
};

// Standard Easing Curves
export const EASINGS = {
  appleEase: [0.16, 1, 0.3, 1] as [number, number, number, number],
  easeOutQuart: [0.25, 1, 0.5, 1] as [number, number, number, number],
};

// 1. Dropdown & Popover Motion Preset
export const dropdownMotion = {
  initial: { opacity: 0, scale: 0.96, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -4 },
  transition: { duration: 0.14, ease: EASINGS.appleEase },
};

// 2. Modal Dialog Motion Preset
export const modalMotion = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.16 },
  },
  card: {
    initial: { opacity: 0, scale: 0.95, y: 10 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: 10 },
    transition: SPRINGS.modal,
  },
};

// 3. Tactile Button Micro-Interactions
export const buttonTapMotion = {
  whileHover: { scale: 1.018 } as TargetAndTransition,
  whileTap: { scale: 0.965 } as TargetAndTransition,
  transition: SPRINGS.snappy,
};

export const buttonSubtleTapMotion = {
  whileHover: { scale: 1.01 } as TargetAndTransition,
  whileTap: { scale: 0.98 } as TargetAndTransition,
  transition: SPRINGS.snappy,
};

// 4. Card Hover Lift & Elevation
export const cardHoverMotion = {
  whileHover: { scale: 1.012, y: -1 } as TargetAndTransition,
  transition: SPRINGS.snappy,
};

// 5. Fade In/Out Presets
export const fadeInMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.14 },
};

// 6. Slide Horizontal (e.g. Sidebars & Drawers)
export const sidebarMotion = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
  transition: SPRINGS.popover,
};
