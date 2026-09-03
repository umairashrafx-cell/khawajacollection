export default function PageContainer({ children, className = "" }) {
  return <div className={`mx-auto max-w-7xl px-4 lg:px-6 ${className}`}>{children}</div>;
}

export function PageHeading({ eyebrow, title, description }) {
  return (
    <header className="py-10 lg:py-14">
      {eyebrow && (
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">{eyebrow}</p>
      )}
      <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 max-w-xl text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}
