type IconName =
  | "home"
  | "workspace"
  | "check"
  | "practice"
  | "history"
  | "settings"
  | "bell"
  | "help"
  | "clock"
  | "paperclip"
  | "close"
  | "send"
  | "arrow"
  | "spark"
  | "back";

const paths: Record<IconName, string[]> = {
  home: ["M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"],
  workspace: ["M4 4h16v12H8l-4 4z"],
  check: ["M20 6 9 17l-5-5"],
  practice: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M10 8l6 4-6 4z"],
  history: ["M3 12a9 9 0 1 0 3-6.7", "M3 4v5h5", "M12 8v4l3 2"],
  settings: ["M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z", "M12 2v3", "M12 19v3", "M2 12h3", "M19 12h3", "M5 5l2 2", "M17 17l2 2", "M19 5l-2 2", "M7 17l-2 2"],
  bell: ["M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9", "M10.3 21a2 2 0 0 0 3.4 0"],
  help: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4", "M12 17.2v.1"],
  clock: ["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z", "M12 7v5l3 2"],
  paperclip: ["M21 11.5 12.5 20a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7-7"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  send: ["M22 2 11 13", "M22 2 15 22l-4-9-9-4z"],
  arrow: ["M5 12h14", "m13 6 6 6-6 6"],
  spark: ["M12 3v4", "M12 17v4", "M3 12h4", "M17 12h4", "M5.6 5.6l2.8 2.8", "M15.6 15.6l2.8 2.8", "M18.4 5.6l-2.8 2.8", "M8.4 15.6l-2.8 2.8"],
  back: ["M19 12H5", "m11 18-6-6 6-6"],
};

export function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name].map((d, index) => (
        <path key={index} d={d} />
      ))}
    </svg>
  );
}
