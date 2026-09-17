import { BookOpen, Star, GitFork, GitCommit } from "lucide-react";

export default function ProfileStats({ repoCount = 0, totalStars = 0, totalForks = 0 }) {
  const stats = [
    { icon: BookOpen, label: "Repositories", value: repoCount },
    { icon: Star, label: "Stars Earned", value: totalStars },
    { icon: GitFork, label: "Forks", value: totalForks },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="card-surface p-4 flex flex-col items-center text-center rounded-xl border border-border hover:border-fg-muted/30 transition-all"
          >
            <Icon size={20} className="text-accent-green mb-2" />
            <span className="text-xl font-bold text-fg">{stat.value}</span>
            <span className="text-xs text-fg-muted mt-0.5">{stat.label}</span>
          </div>
        );
      })}
    </div>
  );
}
