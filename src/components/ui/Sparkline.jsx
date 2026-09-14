/**
 * Tiny bar sparkline for the last N values in 0..1.
 * The most recent bar takes the accent so the eye lands on "how did it go last time".
 */
const Sparkline = ({ values = [], slots = 5, height = 10, barWidth = 4, gap = 2 }) => {
  const recent = values.slice(-slots);
  const padding = Math.max(0, slots - recent.length);

  return (
    <div className="flex items-end" style={{ gap, height }} aria-hidden="true">
      {Array.from({ length: padding }).map((_, i) => (
        <div key={`pad-${i}`} style={{ width: barWidth, height: 2 }} className="rounded-[1px] bg-line" />
      ))}
      {recent.map((v, i) => {
        const isLast = i === recent.length - 1;
        const h = Math.max(2, Math.round(Math.min(1, Math.max(0, v)) * height));
        return (
          <div
            key={i}
            style={{ width: barWidth, height: h }}
            className={`rounded-[1px] ${isLast ? 'bg-accent' : 'bg-ink-3'}`}
          />
        );
      })}
    </div>
  );
};

export default Sparkline;
