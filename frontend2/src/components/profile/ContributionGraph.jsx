import { useState, useMemo } from "react";
import { Flame, Calendar, Trophy, GitCommit } from "lucide-react";

const contributionColors = [
  "#161b22", // Level 0 - empty
  "#0e4429", // Level 1
  "#006d32", // Level 2
  "#26a641", // Level 3
  "#39d353", // Level 4 - highest
];

export default function ContributionGraph({ username = "User", contributions = null }) {
  const [hoveredDay, setHoveredDay] = useState(null);

  // Generate 52 weeks of day data with realistic dates and counts
  const { weeks, stats } = useMemo(() => {
    const today = new Date();
    const daysData = [];
    
    // 52 weeks * 7 days = 364 days + current day offset
    const totalDays = 52 * 7;
    let totalCount = 0;
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Seeded random / patterned values if no custom matrix passed
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      let count = 0;
      if (contributions && contributions[dateStr] !== undefined) {
        count = contributions[dateStr];
      } else {
        // Deterministic pseudo-random pattern based on username + date
        const hash = (date.getDate() * 13 + date.getMonth() * 37 + (username.length * 7)) % 100;
        if (hash > 45) {
          count = hash % 5;
        }
      }

      totalCount += count;
      if (count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }

      let level = 0;
      if (count >= 1 && count <= 2) level = 1;
      else if (count >= 3 && count <= 4) level = 2;
      else if (count >= 5 && count <= 7) level = 3;
      else if (count >= 8) level = 4;
      else if (count > 0) level = 1;

      daysData.push({
        date: dateStr,
        formattedDate: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric"
        }),
        dayOfWeek: date.getDay(), // 0 = Sun, 6 = Sat
        count,
        level
      });
    }

    // Determine current streak ending today
    let checkStreak = 0;
    for (let i = daysData.length - 1; i >= 0; i--) {
      if (daysData[i].count > 0) {
        checkStreak++;
      } else if (i === daysData.length - 1) {
        // today had 0, check yesterday
        continue;
      } else {
        break;
      }
    }
    currentStreak = checkStreak;

    // Group into 52 weeks (7 days each)
    const weeksArr = [];
    for (let w = 0; w < 52; w++) {
      weeksArr.push(daysData.slice(w * 7, (w + 1) * 7));
    }

    return {
      weeks: weeksArr,
      stats: {
        total: totalCount,
        currentStreak,
        longestStreak
      }
    };
  }, [username, contributions]);

  // Month labels across the 52 weeks
  const monthLabels = useMemo(() => {
    const months = [];
    let lastMonth = -1;

    weeks.forEach((week, index) => {
      const firstDay = week[0];
      if (firstDay) {
        const date = new Date(firstDay.date);
        const month = date.getMonth();
        if (month !== lastMonth && index % 4 === 0) {
          months.push({
            index,
            name: date.toLocaleDateString("en-US", { month: "short" })
          });
          lastMonth = month;
        }
      }
    });
    return months;
  }, [weeks]);

  return (
    <div className="card-surface p-6 rounded-xl border border-border shadow-sm">
      {/* Header & Stats Banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fg flex items-center gap-2">
            <GitCommit size={20} className="text-accent-green" />
            Contributions in the last year
          </h2>
          <p className="text-sm text-fg-muted mt-0.5">
            {stats.total} total contributions in the last 12 months
          </p>
        </div>

        {/* Mini streak badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg bg-canvas px-3 py-1.5 border border-border text-xs">
            <Flame size={15} className="text-amber-500 animate-pulse" />
            <span className="text-fg-muted">Current:</span>
            <span className="font-semibold text-fg">{stats.currentStreak} days</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg bg-canvas px-3 py-1.5 border border-border text-xs">
            <Trophy size={15} className="text-yellow-500" />
            <span className="text-fg-muted">Best:</span>
            <span className="font-semibold text-fg">{stats.longestStreak} days</span>
          </div>
        </div>
      </div>

      {/* Heatmap Area */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px]">
          {/* Month labels */}
          <div className="flex mb-1 text-xs text-fg-subtle pl-7">
            {monthLabels.map((m) => (
              <span
                key={m.index}
                style={{ marginLeft: `${m.index * 14}px` }}
                className="absolute"
              >
                {m.name}
              </span>
            ))}
          </div>

          <div className="relative pt-4 flex gap-2 items-start">
            {/* Day of week labels */}
            <div className="flex flex-col gap-[3px] text-[10px] text-fg-subtle pt-[2px] pr-1 select-none">
              <span className="h-[11px] leading-[11px]">Mon</span>
              <span className="h-[11px] leading-[11px]"></span>
              <span className="h-[11px] leading-[11px]">Wed</span>
              <span className="h-[11px] leading-[11px]"></span>
              <span className="h-[11px] leading-[11px]">Fri</span>
              <span className="h-[11px] leading-[11px]"></span>
              <span className="h-[11px] leading-[11px]"></span>
            </div>

            {/* Heatmap Grid */}
            <div className="flex gap-[3px]">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px]">
                  {week.map((day, dayIndex) => {
                    const isHovered = hoveredDay?.date === day.date;
                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`h-[11px] w-[11px] rounded-[2px] transition-all cursor-pointer ${
                          isHovered ? "ring-2 ring-accent-green scale-125 z-10" : "hover:scale-110"
                        }`}
                        style={{
                          backgroundColor: contributionColors[day.level] || contributionColors[0]
                        }}
                        onMouseEnter={() => setHoveredDay(day)}
                        onMouseLeave={() => setHoveredDay(null)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Info & Legend Footer */}
      <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-border sm:flex-row sm:items-center sm:justify-between text-xs">
        <div className="text-fg-muted h-5 flex items-center">
          {hoveredDay ? (
            <span className="animate-fadeIn">
              <strong className="text-fg font-medium">
                {hoveredDay.count === 0 ? "No" : hoveredDay.count} contribution{hoveredDay.count === 1 ? "" : "s"}
              </strong>{" "}
              on {hoveredDay.formattedDate}
            </span>
          ) : (
            <span className="text-fg-subtle">Hover over a square to view daily activity</span>
          )}
        </div>

        {/* Intensity Legend */}
        <div className="flex items-center gap-1.5 text-fg-subtle">
          <span>Less</span>
          {contributionColors.map((color, index) => (
            <div
              key={index}
              className="h-[11px] w-[11px] rounded-[2px]"
              style={{ backgroundColor: color }}
              title={`Level ${index}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
