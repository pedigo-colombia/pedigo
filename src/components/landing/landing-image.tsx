"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

/** URL remota (Unsplash) por defecto; opcional archivo en /public/landing/ como respaldo. */
export function LandingImage({
  src,
  localSrc,
  alt,
  className,
  priority,
}: {
  src: string;
  localSrc?: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [current, setCurrent] = useState(src);

  return (
    <Image
      src={current}
      alt={alt}
      fill
      className={cn("object-cover", className)}
      sizes="(max-width: 768px) 100vw, 50vw"
      priority={priority}
      onError={() => {
        if (localSrc && current === src) setCurrent(localSrc);
      }}
    />
  );
}
