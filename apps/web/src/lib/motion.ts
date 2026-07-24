import type { Variants } from "framer-motion";

export const transition = { duration: 0.2, ease: [0.16, 1, 0.3, 1] } as const;
export const fadeIn: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition } };
export const slideUp: Variants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition } };
export const slideLeft: Variants = { hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0, transition } };
export const scaleIn: Variants = { hidden: { opacity: 0, scale: 0.98 }, visible: { opacity: 1, scale: 1, transition } };
export const staggerChildren: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
export const pageTransition: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { ...transition, duration: 0.24 } }, exit: { opacity: 0, y: -8, transition: { ...transition, duration: 0.16 } } };
export const modalAnimation: Variants = { hidden: { opacity: 0, scale: 0.97, y: 8 }, visible: { opacity: 1, scale: 1, y: 0, transition }, exit: { opacity: 0, scale: 0.98, y: 8, transition: { ...transition, duration: 0.14 } } };
export const drawerAnimation: Variants = { hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0, transition }, exit: { opacity: 0, x: 24, transition: { ...transition, duration: 0.14 } } };
export const hoverLift = { whileHover: { y: -2, transition }, whileTap: { scale: 0.99, transition: { ...transition, duration: 0.1 } } } as const;
export const buttonPress = { whileTap: { scale: 0.98, transition: { ...transition, duration: 0.1 } } } as const;
export const cardHover = { whileHover: { y: -2, transition } } as const;

