"use client";

import { memo, ReactNode, HTMLAttributes } from "react";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { cn } from "@/lib/utils";

type AnimationType = "fade-up" | "fade-in" | "scale" | "slide-left" | "slide-right";

interface ScrollAnimateProps extends HTMLAttributes<HTMLDivElement> {
  /** Content to animate */
  children: ReactNode;
  /** Type of animation */
  animation?: AnimationType;
  /** Delay in milliseconds (CSS transition delay) */
  delay?: number;
  /** Duration in milliseconds */
  duration?: number;
  /** Viewport threshold (0-1) for triggering animation */
  threshold?: number;
  /** Root margin for Intersection Observer */
  rootMargin?: string;
  /** Whether animation should replay when element leaves viewport */
  once?: boolean;
  /** Additional class names */
  className?: string;
}

// Animation config for each type
const animationConfig: Record<AnimationType, { initial: string; animate: string }> = {
  "fade-up": {
    initial: "opacity-0 translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "fade-in": {
    initial: "opacity-0",
    animate: "opacity-100",
  },
  scale: {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
  },
  "slide-left": {
    initial: "opacity-0 -translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "slide-right": {
    initial: "opacity-0 translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
};

/**
 * Wrapper component that animates children when they enter the viewport.
 * Uses Intersection Observer for efficient scroll detection.
 *
 * @example
 * <ScrollAnimate animation="fade-up" delay={100}>
 *   <Card>Content</Card>
 * </ScrollAnimate>
 */
function ScrollAnimate({
  children,
  animation = "fade-up",
  delay = 0,
  duration = 600,
  threshold = 0.1,
  rootMargin = "0px",
  once = true,
  className,
  style,
  ...props
}: ScrollAnimateProps) {
  const { ref, hasBeenInView, isInView } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: once,
  });

  const config = animationConfig[animation];
  const shouldShow = once ? hasBeenInView : isInView;

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "transition-all will-change-transform",
        shouldShow ? config.animate : config.initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export default memo(ScrollAnimate);
