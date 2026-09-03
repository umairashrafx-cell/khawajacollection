import { useEffect, useState } from "react";
import { announcements } from "@/data/promos";

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % announcements.length), 4500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-foreground text-background">
      <div
        className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-center text-[11px] tracking-[0.18em] uppercase"
        aria-live="polite"
      >
        <span key={index} className="animate-in fade-in duration-500">
          {announcements[index]}
        </span>
      </div>
    </div>
  );
}
