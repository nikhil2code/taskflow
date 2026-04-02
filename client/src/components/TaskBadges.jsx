import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground border-border' },
  assigned: { label: 'Assigned', className: 'bg-info/15 text-info border-info/30' },
  in_progress: { label: 'In Progress', className: 'bg-warning/15 text-warning border-warning/30' },
  submitted: { label: 'Submitted', className: 'bg-primary/15 text-primary border-primary/30' },
  approved: { label: 'Approved', className: 'bg-success/15 text-success border-success/30' },
  rejected: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'bg-muted text-muted-foreground border-border' },
  medium: { label: 'Medium', className: 'bg-info/15 text-info border-info/30' },
  high: { label: 'High', className: 'bg-warning/15 text-warning border-warning/30' },
  urgent: { label: 'Urgent', className: 'bg-destructive/15 text-destructive border-destructive/30' },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' };
  return <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>{config.label}</Badge>;
};

export const PriorityBadge = ({ priority }) => {
  const config = priorityConfig[priority] || { label: priority, className: 'bg-muted text-muted-foreground border-border' };
  return <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>{config.label}</Badge>;
};