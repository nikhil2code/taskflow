import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, CheckCircle, XCircle, Send, ListTodo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getNotifications, markAsRead, markAllAsRead } from '@/services/notificationService';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await getNotifications();
        setNotifications(data);
      } catch {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id, taskId) => {
    try {
      await markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      if (taskId) navigate(`/tasks/${taskId}`);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  if (!user) return null;

  const iconMap = {
    task_assigned: <ListTodo className="h-4 w-4 text-info" />,
    task_approved: <CheckCircle className="h-4 w-4 text-success" />,
    task_rejected: <XCircle className="h-4 w-4 text-destructive" />,
    task_submitted: <Send className="h-4 w-4 text-primary" />,
    comment: <Bell className="h-4 w-4 text-muted-foreground" />,
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading notifications...</p>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div
              key={n._id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors',
                n.isRead ? 'bg-card' : 'bg-accent/50 border-primary/20'
              )}
              onClick={() => handleMarkAsRead(n._id, n.taskId)}
            >
              <div className="mt-0.5">{iconMap[n.type]}</div>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !n.isRead && 'font-medium')}>{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No notifications</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;