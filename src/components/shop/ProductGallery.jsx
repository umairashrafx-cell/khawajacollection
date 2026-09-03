import { useState } from "react";

export default function ProductGallery({ images, name }) {
  const [active, setActive] = useState(0);

  return (
    <div className="lg:flex lg:gap-4">
      <div className="order-2 mt-3 flex gap-3 overflow-x-auto lg:order-1 lg:mt-0 lg:flex-col lg:overflow-visible">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={i === active}
            className={`shrink-0 border ${i === active ? "border-foreground" : "border-transparent"}`}
          >
            <img src={src} alt="" loading="lazy" className="h-20 w-16 object-cover" />
          </button>
        ))}
      </div>
      <div className="order-1 flex-1 overflow-hidden bg-sand lg:order-2">
        <img
          src={images[active]}
          alt={name}
          width={900}
          height={1200}
          className="aspect-[3/4] w-full object-cover"
        />
      </div>
    </div>
  );
}
