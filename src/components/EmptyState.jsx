export default function EmptyState({ onAddTask, filtered = false }) {
  return (
    <div className="panel grid min-h-64 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-fuchsia-50 text-xl font-bold text-fuchsia-500 dark:bg-fuchsia-500/10">
          OK
        </div>
        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
          {filtered ? "No matching tasks" : "Your day is open"}
        </h3>
        <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          {filtered
            ? "Adjust the search or filters to see more of your schedule."
            : "Add your first task and turn plans into steady progress."}
        </p>
        {!filtered && (
          <button className="button-primary mt-5" onClick={onAddTask} type="button">
            Create a task
          </button>
        )}
      </div>
    </div>
  );
}
