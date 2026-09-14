import { winBand } from '../../utils/calculations';

const BAR = { hot: 'bg-accent', good: 'bg-accent/45', cold: 'bg-line-strong' };

/**
 * Tiny bar sparkline for the last N session win rates in 0..1.
 * Colour intensity carries the meaning: strong for 70%+, faded for .500 or
 * better, grey for a losing day.
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
        const h = Math.max(2, Math.round(Math.min(1, Math.max(0, v)) * height));
        return <div key={i} style={{ width: barWidth, height: h }} className={`rounded-[1px] ${BAR[winBand(v)]}`} />;
      })}
    </div>
  );
};

export default Sparkline;
