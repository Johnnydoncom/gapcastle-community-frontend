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
        // eslint-disable-next-line @next/next/no-img-element -- avatars are served by the API host
        <img src={url} alt={name ?? "Avatar"} className="size-full object-cover" loading="lazy" />
      ) : (
        initials
      )}
    </span>
  );
}

export { Avatar };
