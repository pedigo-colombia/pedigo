"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Imagen remota (Unsplash, etc.) con placeholder si falla la carga. */
export function RemoteImage({
  src,
  alt,
  className,
  containerClassName,
  sizes = "(max-width: 768px) 50vw, 200px",
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          containerClassName,
        )}
      >
        <ImageIcon className="h-8 w-8 opacity-40" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted", containerClassName)}>
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        sizes={sizes}
        priority={priority}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
