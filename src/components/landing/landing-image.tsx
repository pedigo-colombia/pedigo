"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function LandingImage({
  localSrc,
  fallbackSrc,
  alt,
  className,
  priority,
}: {
  localSrc: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [src, setSrc] = useState(localSrc);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes="(max-width: 768px) 100vw, 50vw"
      priority={priority}
      onError={() => {
        if (src !== fallbackSrc) setSrc(fallbackSrc);
      }}
    />
  );
}
