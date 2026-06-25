export default function Toast({ message, actionLabel, onAction, onDismiss }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-4 rounded-xl bg-[#171722] px-4 py-3 text-sm text-white shadow-2xl shadow-fuchsia-500/20 dark:bg-white dark:text-slate-900">
      <span>{message}</span>
      {onAction && (
        <button className="font-semibold text-fuchsia-300 dark:text-fuchsia-600" onClick={onAction} type="button">
          {actionLabel}
        </button>
      )}
      <button aria-label="Dismiss message" className="text-slate-400" onClick={onDismiss} type="button">
        x
      </button>
    </div>
  );
}
