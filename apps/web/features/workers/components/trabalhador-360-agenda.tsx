import { DashboardPanel } from "@/features/dashboard/components/dashboard-panel";
import { DEMO_TRAB_AGENDA } from "@/features/workers/demo-trabalhador-360";

/** DEMO UI — agenda. */
export function Trabalhador360Agenda() {
  return (
    <DashboardPanel title="Agenda" subtitle="Próximos compromissos · demo">
      <ul className="divide-y divide-border/55">
        {DEMO_TRAB_AGENDA.map((a) => (
          <li key={a.when} className="px-5 py-3">
            <span className="font-mono text-label text-ink-3">{a.when}</span>
            <p className="text-dense font-bold text-ink">{a.title}</p>
            <p className="text-xs text-ink-3">{a.meta}</p>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
