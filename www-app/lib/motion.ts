import type { HTMLMotionProps } from "framer-motion";

export const scrollReveal: Omit<HTMLMotionProps<"div">, "children"> = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5, ease: "easeOut" as const },
};
