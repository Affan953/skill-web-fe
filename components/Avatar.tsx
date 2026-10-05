"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
}

export default function Avatar({
  name,
  src,
  size = 40,
  alt,
  className,
  priority = false,
}: AvatarProps) {
  const [broken, setBroken] = useState(false);

  const safeSrc =
    src && /^https?:\/\//i.test(src) && !broken ? src : null;

  const initials =
    (name || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "?";

  if (!safeSrc) {
    return (
      <span
        role="img"
        aria-label={alt ?? name}
        className={cn(
          "flex select-none items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#60A5FA] font-bold text-white",
          className
        )}
        style={{
          width: size,
          height: size,
          fontSize: Math.max(10, Math.round(size * 0.4)),
        }}
      >
        {initials}
      </span>
    );
  }

  return (
    <Image
      src={safeSrc}
      alt={alt ?? name}
      width={size}
      height={size}
      unoptimized
      priority={priority}
      onError={() => setBroken(true)}
      className={cn("rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}