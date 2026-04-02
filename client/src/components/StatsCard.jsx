import { cn } from '@/lib/utils';

const StatsCard = ({ title, value, icon, trend, className }) => (
  <div className={cn('rounded-lg border bg-card p-5 task-card-hover', className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && <p className="text-xs text-success font-medium">{trend}</p>}
      </div>
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
    </div>
  </div>
);

export default StatsCard;
