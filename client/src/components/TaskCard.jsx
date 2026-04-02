import { StatusBadge, PriorityBadge } from './TaskBadges';
import { Progress } from '@/components/ui/progress';
import { Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TaskCard = ({ task }) => {
  const navigate = useNavigate();

  // assignedTo is now a populated object from backend: { _id, name, email, role }
  const assigneeName = task.assignedTo?.name || 'Unassigned';
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved';

  return (
    <div
      onClick={() => navigate(`/tasks/${task._id}`)}
      className="rounded-lg border bg-card p-4 cursor-pointer task-card-hover animate-fade-in"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1 mr-2">{task.title}</h3>
        <PriorityBadge priority={task.priority} />
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{task.percentageCompleted}%</span>
          </div>
          <Progress value={task.percentageCompleted} className="h-1.5" />
        </div>
        <div className="flex items-center justify-between">
          <StatusBadge status={task.status} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {assigneeName.split(' ')[0]}
            </span>
            {task.deadline && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive font-medium' : ''}`}>
                <Calendar className="h-3 w-3" />
                {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;