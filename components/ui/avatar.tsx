import Image from "next/image";
import { cn } from "@/lib/utils";


function Avatar({
  url,
  name,
  className,
}: {
  url?: string | null | undefined;
  name?: string | null | undefined;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-secondary-foreground",
        className,
      )}
    >
      {url ? (
        <Image src={url} alt={name ?? "Avatar"} fill sizes="96px" className="object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}

export { Avatar };
