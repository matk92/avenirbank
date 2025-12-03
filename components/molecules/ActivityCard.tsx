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
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">{timestamp}</p>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
      <div>
        <button className="text-sm font-semibold text-white transition-opacity hover:opacity-70">{actionLabel}</button>
      </div>
    </Card>
  );
}
