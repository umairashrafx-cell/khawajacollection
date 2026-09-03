import { Link } from "@tanstack/react-router";
import hero from "@/assets/hero-women.jpg";
import { heroSlide } from "@/data/promos";

export default function Hero() {
  return (
    <section className="relative">
      <img
        src={hero}
        alt="Model wearing an ivory embroidered shalwar kameez from the Khawaja Collection autumn edit"
        width={1600}
        height={1104}
        className="h-[68vh] min-h-[420px] w-full object-cover object-[60%_center] lg:h-[78vh]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/45 to-transparent" />
      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto w-full max-w-7xl px-4 lg:px-6">
          <div className="max-w-lg">
            <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
              {heroSlide.eyebrow}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              {heroSlide.title}
            </h1>
            <p className="mt-4 max-w-md text-sm text-foreground/75 sm:text-base">
              {heroSlide.body}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to={heroSlide.primaryCta.to}
                className="bg-foreground px-7 py-3 text-[11px] uppercase tracking-[0.22em] text-background transition-opacity hover:opacity-90"
              >
                {heroSlide.primaryCta.label}
              </Link>
              <Link
                to={heroSlide.secondaryCta.to}
                className="border border-foreground px-7 py-3 text-[11px] uppercase tracking-[0.22em] transition-colors hover:bg-foreground hover:text-background"
              >
                {heroSlide.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
