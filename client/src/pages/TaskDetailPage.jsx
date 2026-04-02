import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import { StatusBadge, PriorityBadge } from '@/components/TaskBadges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, User, Clock, Send, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getTaskById } from '@/services/taskService';

const TaskDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { updateTaskProgress, approve, reject, addTaskComment } = useTask();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const { data } = await getTaskById(id);
        setTask(data);
        setProgressValue(data.percentageCompleted);
      } catch {
        toast.error('Failed to load task');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Loading task...</div>;
  }

  if (!task || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Task not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // assignedTo and assignedBy are populated objects from backend
  const assigneeName = task.assignedTo?.name || 'Unassigned';
  const assignerName = task.assignedBy?.name || 'Unknown';
  const isAssignee = user._id === task.assignedTo?._id;
  const isManager = user.role === 'manager' || user.role === 'teamlead';
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'approved';

  const handleProgressChange = async (val) => {
    setProgressValue(val);
    try {
      const updated = await updateTaskProgress(task._id, val);
      setTask(updated);
    } catch {
      toast.error('Failed to update progress');
    }
  };

  const handleSubmitTask = async () => {
    try {
      const updated = await updateTaskProgress(task._id, 100);
      setTask(updated);
      toast.success('Task submitted for review!');
    } catch {
      toast.error('Failed to submit task');
    }
  };

  const handleApprove = async () => {
    try {
      await approve(task._id);
      setTask(prev => ({ ...prev, status: 'approved' }));
      toast.success('Task approved!');
    } catch {
      toast.error('Failed to approve task');
    }
  };

  const handleReject = async () => {
    try {
      await reject(task._id);
      setTask(prev => ({ ...prev, status: 'rejected' }));
      toast.error('Task rejected');
    } catch {
      toast.error('Failed to reject task');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const updated = await addTaskComment(task._id, comment);
      setTask(updated);
      setComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    }
  };

  return (
    <div className="max-w-3xl animate-fade-in">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="bg-card rounded-lg border p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-xl font-bold tracking-tight">{task.title}</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Assigned To</p>
            <p className="font-medium">{assigneeName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1"><User className="h-3.5 w-3.5" /> Assigned By</p>
            <p className="font-medium">{assignerName}</p>
          </div>
          <div className="space-y-1">
            <p className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
              <Calendar className="h-3.5 w-3.5" /> Deadline
            </p>
            <p className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
              {task.deadline
                ? new Date(task.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'No deadline'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Updated</p>
            <p className="font-medium">{new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">{progressValue}%</span>
          </div>
          <Progress value={progressValue} className="h-2" />
          {isAssignee && (task.status === 'pending' || task.status === 'in_progress' || task.status === 'rejected') && (
            <Slider
              value={[progressValue]}
              max={100}
              step={5}
              onValueChange={([val]) => handleProgressChange(val)}
              className="mt-2"
            />
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          {isAssignee && task.status === 'in_progress' && progressValue === 100 && (
            <Button onClick={handleSubmitTask} className="gap-1.5">
              <Send className="h-4 w-4" /> Submit for Review
            </Button>
          )}
          {isManager && task.status === 'submitted' && (
            <>
              <Button onClick={handleApprove} className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button onClick={handleReject} variant="destructive" className="gap-1.5">
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </>
          )}
        </div>

        <div className="border-t pt-6 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Comments ({task.comments?.length || 0})
          </h3>
          {task.comments?.map(c => (
            <div key={c._id} className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                {c.user?.name?.split(' ').map(n => n[0]).join('') || '?'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{c.user?.name || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <Input placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1" />
            <Button type="submit" size="sm">Post</Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;