const indicator = document.getElementById("indicator") as HTMLSpanElement;
const status = document.getElementById("status") as HTMLParagraphElement;
const state = document.getElementById("state") as HTMLSpanElement;
const refresh = document.getElementById("refresh") as HTMLButtonElement;

export function updateFlagWidget(enabled: boolean | undefined) {
  if (enabled === undefined) {
    indicator.className =
      "inline-block h-3 w-3 rounded-full bg-slate-300 ring-4 ring-slate-300/20 transition-colors animate-pulse";
    state.textContent = "—";
    state.className = "text-xs font-medium uppercase tracking-wide text-slate-400";
    status.textContent = "loading...";
    return;
  }

  indicator.className =
    "inline-block h-3 w-3 rounded-full transition-colors " +
    (enabled ? "bg-emerald-500 ring-4 ring-emerald-500/20" : "bg-rose-500 ring-4 ring-rose-500/20");

  state.textContent = enabled ? "on" : "off";
  state.className =
    "text-xs font-medium uppercase tracking-wide " +
    (enabled ? "text-emerald-600" : "text-rose-600");

  status.textContent = "ready";
}

export function onRefresh(handler: () => Promise<void>) {
  refresh.addEventListener("click", async () => {
    refresh.disabled = true;
    try {
      await handler();
    } finally {
      refresh.disabled = false;
    }
  });
}
