"use client";

import Image from "next/image";
import { useState } from "react";

import { brandAssets } from "@/lib/brand/assets";
import { useResolvedDark } from "@/hooks/use-resolved-theme";
import { cn } from "@/lib/utils";

/** Isotipo + wordmark PediGo. Carga assets desde /public/brand/ con fallback tipográfico. */
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
  const [isotipoSrc, setIsotipoSrc] = useState<string>(brandAssets.isotipo);
  const [isotipoFailed, setIsotipoFailed] = useState(false);
  const [wordmarkFailed, setWordmarkFailed] = useState(false);

  const box = size === "sm" ? 32 : size === "lg" ? 44 : 36;
  const wordClass =
    size === "sm" ? "text-base" : size === "lg" ? "text-xl" : "text-lg";
  const horizontalSrc = isDark ? brandAssets.logoDark : brandAssets.logoLight;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {!isotipoFailed ? (
        <Image
          src={isotipoSrc}
          alt=""
          width={box}
          height={box}
          className="shrink-0 rounded-xl object-contain"
          onError={() => {
            if (isotipoSrc === brandAssets.isotipo) {
              setIsotipoSrc(brandAssets.isotipoPng);
            } else {
              setIsotipoFailed(true);
            }
          }}
          priority={size !== "sm"}
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
      {showWordmark &&
        (wordmarkFailed ? (
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
            width={size === "sm" ? 96 : size === "lg" ? 128 : 108}
            height={size === "sm" ? 28 : size === "lg" ? 36 : 32}
            className="h-7 w-auto object-contain object-left sm:h-8"
            onError={() => setWordmarkFailed(true)}
          />
        ))}
    </div>
  );
}
