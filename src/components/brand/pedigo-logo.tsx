"use client";

import Image from "next/image";
import { useState } from "react";

import { brandAssets } from "@/lib/brand/assets";
import { useResolvedDark } from "@/hooks/use-resolved-theme";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { isotipo: 36, horizontal: { w: 132, h: 32 }, maxH: "max-h-9 sm:max-h-10" },
  md: { isotipo: 40, horizontal: { w: 160, h: 38 }, maxH: "max-h-10 sm:max-h-11" },
  lg: { isotipo: 48, horizontal: { w: 192, h: 46 }, maxH: "max-h-11 sm:max-h-12 lg:max-h-14" },
} as const;

/**
 * Logo PediGo desde /public/brand/.
 * - showWordmark=true → solo logo horizontal (ya incluye isotipo + texto).
 * - showWordmark=false → solo isotipo.
 */
export function PedigoLogo({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const isDark = useResolvedDark();
  const dims = sizes[size];
  const [isotipoSrc, setIsotipoSrc] = useState<string>(brandAssets.isotipo);
  const [isotipoFailed, setIsotipoFailed] = useState(false);
  const [wordmarkFailed, setWordmarkFailed] = useState(false);

  const horizontalSrc = isDark ? brandAssets.logoDark : brandAssets.logoLight;
  const wordClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";

  if (showWordmark) {
    return (
      <div className={cn("flex items-center", className)}>
        {wordmarkFailed ? (
          <span
            className={cn(
              "font-heading font-bold leading-none tracking-tight",
              wordClass,
            )}
          >
            <span className="text-brand-navy dark:text-foreground">Pedi</span>
            <span className="text-brand-orange">Go</span>
          </span>
        ) : (
          <Image
            src={horizontalSrc}
            alt="PediGo"
            width={dims.horizontal.w}
            height={dims.horizontal.h}
            className={cn("h-auto w-auto object-contain object-left", dims.maxH)}
            priority
            onError={() => setWordmarkFailed(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center", className)}>
      {!isotipoFailed ? (
        <Image
          src={isotipoSrc}
          alt="PediGo"
          width={dims.isotipo}
          height={dims.isotipo}
          className="shrink-0 object-contain"
          onError={() => {
            if (isotipoSrc === brandAssets.isotipo) {
              setIsotipoSrc(brandAssets.isotipoPng);
            } else {
              setIsotipoFailed(true);
            }
          }}
          priority
        />
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-xl bg-brand-orange font-heading font-extrabold text-white shadow-sm",
            size === "sm"
              ? "h-8 w-8 text-sm"
              : size === "lg"
                ? "h-11 w-11 text-lg"
                : "h-9 w-9 text-base",
          )}
          aria-hidden
        >
          P
        </div>
      )}
    </div>
  );
}
