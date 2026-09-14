/**
 * Compact page header: brand eyebrow, big condensed title, optional action on the right.
 * Padded for the status bar when installed to the home screen.
 */
const PageHeader = ({ title, action, eyebrow = "Wyatt's Win Tracker" }) => (
  <header className="px-5 pt-[calc(env(safe-area-inset-top)+16px)] pb-2">
    <div className="eyebrow mb-2">{eyebrow}</div>
    <div className="flex items-end justify-between gap-3">
      <h1 className="display text-[40px] leading-none text-ink font-extrabold">{title}</h1>
      {action}
    </div>
  </header>
);

export default PageHeader;
