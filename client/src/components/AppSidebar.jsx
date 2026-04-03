import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListTodo, PlusCircle, Bell, LogOut,
  ChevronLeft, ChevronRight, CheckSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserCircle }from 'lucide-react';

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const { tasks } = useTask();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const isManager = user.role === 'manager' || user.role === 'teamlead';

  // Count submitted tasks as "unread" for managers, or rejected tasks for employees
  const unread = isManager
    ? tasks.filter(t => t.status === 'submitted').length
    : tasks.filter(t => t.status === 'rejected').length;

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-tasks', icon: ListTodo, label: 'My Tasks' },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
    ...(isManager ? [{ to: '/all-tasks', icon: CheckSquare, label: 'All Tasks' }] : []),
    ...(isManager ? [{ to: '/create-task', icon: PlusCircle, label: 'Create Task' }] : []),
  ];

  return (
    <div className={cn(
      'h-screen flex flex-col gradient-sidebar border-r border-sidebar-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <CheckSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-sidebar-primary-foreground text-lg tracking-tight">TaskFlow</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <link.icon className="h-4 w-4 shrink-0" />
            {!collapsed && link.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-2">
        <button
          onClick={() => navigate('/notifications')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all relative"
        >
          <Bell className="h-4 w-4 shrink-0" />
          {!collapsed && 'Notifications'}
          {unread > 0 && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {unread}
            </span>
          )}
        </button>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-accent-foreground shrink-0">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-primary-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-sidebar-foreground capitalize">{user.role.replace('_', ' ')}</p>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={logout} className="text-sidebar-foreground hover:text-destructive shrink-0 h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;