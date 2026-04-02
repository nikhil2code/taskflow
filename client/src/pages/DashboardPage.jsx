import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import StatsCard from '@/components/StatsCard';
import TaskCard from '@/components/TaskCard';
import { ListTodo, CheckCircle, Clock, XCircle, AlertTriangle, Send } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, fetchAllTasks, fetchMyTasks, loading } = useTask();

  const isManager = user?.role === 'manager' || user?.role === 'teamlead';

  useEffect(() => {
    if (isManager) {
      fetchAllTasks();
    } else {
      fetchMyTasks();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'approved').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'submitted').length,
    rejected: tasks.filter(t => t.status === 'rejected').length,
    overdue: tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'approved').length,
  };

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
  console.log("task",tasks)
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isManager ? 'Manager Dashboard' : 'My Dashboard'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Welcome back, {user?.name?.split(' ')[0]}. Here's your {isManager ? 'team' : 'task'} overview.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard title="Total Tasks" value={stats.total} icon={<ListTodo className="h-5 w-5" />} />
        <StatsCard title="Completed" value={stats.completed} icon={<CheckCircle className="h-5 w-5" />} />
        <StatsCard title="In Progress" value={stats.inProgress} icon={<Clock className="h-5 w-5" />} />
        <StatsCard title="Submitted" value={stats.pending} icon={<Send className="h-5 w-5" />} />
        <StatsCard title="Rejected" value={stats.rejected} icon={<XCircle className="h-5 w-5" />} />
        <StatsCard title="Overdue" value={stats.overdue} icon={<AlertTriangle className="h-5 w-5" />} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTasks.map(task => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
        {recentTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isManager ? 'No tasks yet. Create your first task!' : 'Tasks assigned to you will appear here.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;