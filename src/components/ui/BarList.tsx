export interface BarListItem {
  label: string
  value: number
}

// Sequential single-hue horizontal bars for "compare magnitude across categories" — each row is
// already identified by its text label, so one consistent hue (not per-row categorical color) is
// the correct color job here. Mark spec: thin bar, rounded at the tip only (square at the
// baseline), value labeled at the tip rather than inline (never clipped). See the dataviz skill.
export function BarList({ items, total }: { items: BarListItem[]; total: number }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => {
        const pct = total > 0 ? (item.value / total) * 100 : 0
        return (
          <li
            key={item.label}
            className="flex items-center gap-3"
            title={`${item.label}: ${item.value.toLocaleString()} (${pct.toFixed(1)}%)`}
          >
            <span className="w-32 shrink-0 truncate text-[12.5px] text-text-secondary sm:w-36">{item.label}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
              <span className="block h-full rounded-r-full bg-brand" style={{ width: `${pct}%` }} />
            </span>
            <span className="w-12 shrink-0 text-right text-[12.5px] font-medium tabular-nums text-text">
              {item.value.toLocaleString()}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
