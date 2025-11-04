import Card from '@/components/atoms/Card';

export type ActivityCardProps = {
  title: string;
  description: string;
  timestamp: string;
  actionLabel: string;
};

export default function ActivityCard({ title, description, timestamp, actionLabel }: ActivityCardProps) {
  return (
    <Card className="flex h-full flex-col justify-between gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-emerald-500 dark:text-emerald-400">{timestamp}</p>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      <div>
        <button className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">{actionLabel}</button>
      </div>
    </Card>
  );
}
