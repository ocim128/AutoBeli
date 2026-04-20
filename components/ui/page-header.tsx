"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  eyebrow?: string;
  description?: string;
  align?: "left" | "center";
  titleAs?: "h1" | "h2" | "h3";
  /** Visual scale: "lg" for storefront hero headers (serif), "default" for admin/content pages (sans). */
  size?: "default" | "lg";
}

export function PageHeader({
  title,
  eyebrow,
  description,
  align = "left",
  titleAs = "h1",
  size = "default",
  className,
  ...props
}: PageHeaderProps) {
  const TitleTag = titleAs;

  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col",
        size === "lg" ? "gap-3" : "gap-1.5",
        align === "center" && "items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
      <TitleTag
        className={cn(
          "leading-tight text-[var(--foreground)]",
          size === "lg"
            ? "font-serif text-3xl md:text-4xl lg:text-5xl"
            : "font-sans text-2xl md:text-3xl"
        )}
      >
        {title}
      </TitleTag>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-[var(--text-muted)]",
            size === "lg" ? "mt-1 text-base" : "mt-0.5 text-sm"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
