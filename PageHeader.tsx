interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}
export default function PageHeader({ eyebrow, title, subtitle }: Props) {
  return (
    <div className="mb-8 animate-fade-up">
      {eyebrow && (
        <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
          <span className="text-[10px] mono text-primary uppercase tracking-widest">{eyebrow}</span>
        </div>
      )}
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
        {title.split(" ").map((w, i) => (
          <span key={i} className={i % 2 === 1 ? "text-gradient" : ""}>
            {w}{" "}
          </span>
        ))}
      </h1>
      {subtitle && <p className="text-muted-foreground mt-3 max-w-2xl">{subtitle}</p>}
    </div>
  );
}
