import type { LucideIcon } from "lucide-react";

interface Props {
  step: number;
  title: string;
  description?: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function Section({ step, title, description, icon: Icon, children }: Props) {
  return (
    <section className="card">
      <header className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-900">
            <span className="mr-1.5 text-emerald-600">{step}.</span>
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}
