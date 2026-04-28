import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTask } from '@/contexts/TaskContext';
import TaskCard from '@/components/TaskCard';
import {
  ListTodo, CheckCircle, Clock, XCircle,
  AlertTriangle, Send, TrendingUp, Users
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

// Animated counter hook
const useCountUp = (target, duration = 1200) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

// Animated stat card
const AnimatedStatCard = ({ title, value, icon, gradient, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const animatedValue = useCountUp(visible ? value : 0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`
      relative overflow-hidden rounded-xl border bg-card p-5
      transition-all duration-700 hover:shadow-md hover:-translate-y-0.5
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`absolute top-0 right-0 h-20 w-20 rounded-full opacity-10 -translate-y-4 translate-x-4 ${gradient}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{animatedValue}</p>
        </div>
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${gradient} bg-opacity-15`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

const COLORS = ['#6366f1', '#f59e0b', '#8b5cf6', '#22c55e', '#ef4444'];

const DashboardPage = () => {
  const { user } = useAuth();
  const { tasks, fetchAllTasks, fetchMyTasks, loading } = useTask();
  const [chartVisible, setChartVisible] = useState(false);

  const isManager = ['admin', 'bod', 'manager', 'teamlead'].includes(user?.role);

  useEffect(() => {
    if (isManager) fetchAllTasks();
    else fetchMyTasks();
    const timer = setTimeout(() => setChartVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-3 text-center">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: tasks.length,
    approved: tasks.filter(t => t.status === 'approved').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    submitted: tasks.filter(t => t.status === 'submitted').length,
    rejected: tasks.filter(t => t.status === 'rejected').length,
    overdue: tasks.filter(t => new Date(t.deadline) < new Date() && t.status !== 'approved').length,
  };

  const recentTasks = [...tasks]
    .filter(t => t && t.status)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 6);

  // Build weekly data from tasks
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const count = tasks.filter(t =>
      t.createdAt && t.createdAt.split('T')[0] === dateStr
    ).length;
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      tasks: count,
    };
  });

  // Status distribution for pie chart
  const pieData = [
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Submitted', value: stats.submitted },
    { name: 'Approved', value: stats.approved },
    { name: 'Rejected', value: stats.rejected },
    { name: 'Pending', value: stats.total - stats.inProgress - stats.submitted - stats.approved - stats.rejected },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isManager ? 'Manager Dashboard' : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Welcome back, <span className="font-medium text-foreground">{user?.name?.split(' ')[0]}</span>.
            Here's your {isManager ? 'team' : 'task'} overview.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live updates active
        </div>
      </div>

      {/* Animated Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <AnimatedStatCard title="Total" value={stats.total} delay={0}
          gradient="bg-indigo-500"
          icon={<ListTodo className="h-5 w-5 text-indigo-600" />} />
        <AnimatedStatCard title="Approved" value={stats.approved} delay={100}
          gradient="bg-green-500"
          icon={<CheckCircle className="h-5 w-5 text-green-600" />} />
        <AnimatedStatCard title="In Progress" value={stats.inProgress} delay={200}
          gradient="bg-amber-500"
          icon={<Clock className="h-5 w-5 text-amber-600" />} />
        <AnimatedStatCard title="Submitted" value={stats.submitted} delay={300}
          gradient="bg-purple-500"
          icon={<Send className="h-5 w-5 text-purple-600" />} />
        <AnimatedStatCard title="Rejected" value={stats.rejected} delay={400}
          gradient="bg-red-500"
          icon={<XCircle className="h-5 w-5 text-red-600" />} />
        <AnimatedStatCard title="Overdue" value={stats.overdue} delay={500}
          gradient="bg-orange-500"
          icon={<AlertTriangle className="h-5 w-5 text-orange-600" />} />
      </div>

      {/* Charts Row */}
      <div className={`grid md:grid-cols-3 gap-4 transition-all duration-1000 ${chartVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Area Chart — Weekly Tasks */}
        <div className="md:col-span-2 bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Task Activity</h3>
              <p className="text-xs text-muted-foreground">Tasks created this week</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="taskGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="tasks"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#taskGradient)"
                animationDuration={1500}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6, fill: '#6366f1' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart — Status Distribution */}
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm">Status Split</h3>
              <p className="text-xs text-muted-foreground">Current distribution</p>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    animationBegin={300}
                    animationDuration={1200}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-xs">
              No task data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <span className="text-xs text-muted-foreground">{recentTasks.length} tasks</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTasks.map((task, i) => (
            <div
              key={task._id}
              className="transition-all duration-500"
              style={{
                opacity: chartVisible ? 1 : 0,
                transform: chartVisible ? 'translateY(0)' : 'translateY(16px)',
                transitionDelay: `${i * 80}ms`
              }}
            >
              <TaskCard task={task} />
            </div>
          ))}
        </div>
        {recentTasks.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ListTodo className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm mt-1">
              {isManager ? 'Create your first task to get started!' : 'Tasks assigned to you will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;