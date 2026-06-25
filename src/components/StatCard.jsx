export default function StatCard({ label, value, detail, accent = "indigo" }) {
  const colors = {
    indigo: "from-violet-500 to-fuchsia-500",
    violet: "from-violet-600 to-fuchsia-500",
    fuchsia: "from-fuchsia-500 to-[#ed2939]",
    emerald: "from-emerald-500 to-teal-500",
    amber: "from-amber-400 to-orange-500",
    rose: "from-[#ed2939] to-fuchsia-500",
  };

  return (
    <article className="panel relative overflow-hidden p-5" data-animate-card>
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors[accent]}`} />
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
    </article>
  );
}
