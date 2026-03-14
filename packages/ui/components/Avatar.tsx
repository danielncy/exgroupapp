import type { ImgHTMLAttributes } from "react";

type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  src?: string | null;
  alt: string;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ src, alt, size = "md", className = "", ...props }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={[
          "inline-block rounded-full object-cover",
          sizeClasses[size],
          className,
        ].join(" ")}
        {...props}
      />
    );
  }

  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full bg-brand-primary font-medium text-white",
        sizeClasses[size],
        className,
      ].join(" ")}
      role="img"
      aria-label={alt}
    >
      {getInitials(alt)}
    </span>
  );
}
