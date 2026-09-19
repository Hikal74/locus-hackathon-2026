interface SectionProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}

/** One heading treatment for every explainer section on the home page. */
export function Section({ id, eyebrow, title, description, children }: SectionProps) {
  return (
    <section id={id} className="mt-24 scroll-mt-28">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{eyebrow}</p>
      <h2 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 max-w-2xl text-ink-soft">{description}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}
