import { formatDate, winBand } from '../../utils/calculations';

const BAR = { hot: 'bg-accent', good: 'bg-accent/45', cold: 'bg-line-strong' };
const LABEL = { hot: 'text-accent', good: 'text-ink-2', cold: 'text-ink-3' };

/**
 * Recent session win rates as labelled bars. The number sits above each bar so
 * 70 and 50 never look alike; colour intensity says hot / fine / cold; the
 * dashed line is .500.
 */
const WinBars = ({ sessions = [], slots = 5, height = 28, labels = true, gap = 6 }) => {
  const recent = sessions.slice(-slots);
  const padding = Math.max(0, slots - recent.length);
  const labelSpace = labels ? 16 : 0;

  return (
    <div className="relative" style={{ height: height + labelSpace }} aria-hidden="true">
      {/* .500 guide */}
      <div
        className="absolute inset-x-0 border-t border-dashed border-line-strong"
        style={{ bottom: Math.round(height * 0.5) }}
      />
      <div className="absolute inset-x-0 bottom-0 flex items-end" style={{ gap, height: height + labelSpace }}>
        {Array.from({ length: padding }).map((_, i) => (
          <div key={`pad-${i}`} className="flex-1 h-[3px] rounded-[2px] bg-line" />
        ))}
        {recent.map((s, i) => {
          const band = winBand(s.winPercentage);
          const barHeight = Math.max(3, Math.round(s.winPercentage * height));
          return (
            <div
              key={s.date + i}
              className="flex-1 flex flex-col items-center justify-end"
              title={`${formatDate(s.date)}: ${Math.round(s.winPercentage * 100)}%`}
            >
              {labels && (
                <span className={`text-[10px] font-semibold tabular leading-none mb-1 ${LABEL[band]}`}>
                  {Math.round(s.winPercentage * 100)}
                </span>
              )}
              <div className={`w-full rounded-[2px] ${BAR[band]}`} style={{ height: barHeight }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WinBars;
