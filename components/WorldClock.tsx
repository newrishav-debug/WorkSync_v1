import React, { useState, useEffect } from 'react';

interface TimezoneConfig {
  city: string;
  zone: string;
}

interface WorldClockProps {
  minimal?: boolean;
}

const timezones: TimezoneConfig[] = [
  { city: 'San Francisco', zone: 'America/Los_Angeles' },
  { city: 'New York', zone: 'America/New_York' },
  { city: 'London', zone: 'Europe/London' },
  { city: 'Kolkata', zone: 'Asia/Kolkata' },
  { city: 'Sydney', zone: 'Australia/Sydney' },
];

const WorldClock: React.FC<WorldClockProps> = ({ minimal = false }) => {
  const [time, setTime] = useState(new Date());
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: tz,
    }).format(date);
  };

  const formatDate = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: tz,
    }).format(date);
  };

  // Minimal mode: just show local time in a compact bar
  if (minimal) {
    return (
      <div className="mb-4 flex items-center justify-end gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
          {formatTime(time, localTz)}
        </span>
        <span className="text-xs">
          {formatDate(time, localTz)}
        </span>
      </div>
    );
  }

  // Full mode: show all timezones
  return (
    <div className="w-full mb-8 overflow-x-auto custom-scrollbar">
      {/* Added py-2 to prevent clipping of scaled/shadowed elements */}
      <div className="flex items-center gap-4 min-w-max md:min-w-0 py-2 px-1">
        <div className="grid grid-cols-5 gap-3 flex-1">
          {timezones.map((tz) => {
            const isLocal = tz.zone === localTz;
            return (
              <div
                key={tz.zone}
                className={`flex flex-col p-3 rounded-xl border transition-all duration-300 ${isLocal
                    ? 'relative z-10 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500/50 shadow-md shadow-indigo-500/10 scale-[1.05]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${isLocal ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-500'
                    }`}>
                    {tz.city}
                  </span>
                  {isLocal && (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5">
                  <span className={`text-sm font-bold font-mono whitespace-nowrap ${isLocal ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                    {formatTime(time, tz.zone)}
                  </span>
                </div>

                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                  {formatDate(time, tz.zone)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorldClock;