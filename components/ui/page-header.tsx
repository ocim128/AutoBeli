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
}

export function PageHeader({
  title,
  eyebrow,
  description,
  align = "left",
  titleAs = "h1",
  className,
  ...props
}: PageHeaderProps) {
  const TitleTag = titleAs;

  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-2",
        align === "center" && "items-center text-center",
        className
      )}
      {...props}
    >
      {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
      <TitleTag className="font-serif text-3xl leading-tight text-[var(--foreground)] md:text-4xl lg:text-5xl">
        {title}
      </TitleTag>
      {description && <p className="max-w-2xl text-base text-[var(--text-muted)]">{description}</p>}
    </div>
  );
}
