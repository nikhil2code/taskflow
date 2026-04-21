import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOverview,
  getTasksPerWeek,
  getEmployeePerformance,
  getActivityLog,
} from '@/services/analyticsService';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { toast } from 'sonner';
import {
  ListTodo, CheckCircle, Clock, AlertTriangle,
  Users, TrendingUp, Activity
} from 'lucide-react';

const STATUS_COLORS = {
  pending: '#94a3b8',
  in_progress: '#f59e0b',
  submitted: '#6366f1',
  approved: '#22c55e',
  rejected: '#ef4444',
};

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-card rounded-lg border p-5 flex items-center gap-4">
    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [overviewRes, weeklyRes, perfRes, logRes] = await Promise.all([
        getOverview(),
        getTasksPerWeek(),
        getEmployeePerformance(),
        getActivityLog(),
      ]);
      setOverview(overviewRes.data);
      setWeeklyData(weeklyRes.data);
      setPerformance(perfRes.data);
      setActivityLog(logRes.data);
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  // Format status data for pie chart
  const statusData = overview?.statusCounts?.map(s => ({
    name: s._id.replace('_', ' '),
    value: s.count,
    color: STATUS_COLORS[s._id] || '#94a3b8',
  })) || [];

  // Format priority data for pie chart
  const priorityData = overview?.priorityCounts?.map(p => ({
    name: p._id,
    value: p.count,
    color: PRIORITY_COLORS[p._id] || '#94a3b8',
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Team performance and task insights
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          value={overview?.totalTasks || 0}
          icon={<ListTodo className="h-6 w-6 text-white" />}
          color="bg-indigo-500"
        />
        <StatCard
          title="Total Users"
          value={overview?.totalUsers || 0}
          icon={<Users className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <StatCard
          title="Overdue"
          value={overview?.overdueTasks || 0}
          icon={<AlertTriangle className="h-6 w-6 text-white" />}
          color="bg-red-500"
        />
        <StatCard
          title="Approved"
          value={overview?.statusCounts?.find(s => s._id === 'approved')?.count || 0}
          icon={<CheckCircle className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
      </div>

      {/* Weekly Tasks Line Chart */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Tasks Created (Last 7 Days)
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="tasks"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* Status Distribution */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4">Tasks by Priority</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee Performance Bar Chart */}
      {performance.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4" /> Employee Performance
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={performance} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#6366f1" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="approved" fill="#22c55e" name="Approved" radius={[4, 4, 0, 0]} />
              <Bar dataKey="rejected" fill="#ef4444" name="Rejected" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Table */}
      {performance.length > 0 && (
        <div className="bg-card rounded-lg border">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Performance Summary</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium">Name</th>
                  <th className="text-left p-3 font-medium">Role</th>
                  <th className="text-center p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Approved</th>
                  <th className="text-center p-3 font-medium">Rejected</th>
                  <th className="text-center p-3 font-medium">Avg Progress</th>
                  <th className="text-center p-3 font-medium">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((emp, i) => (
                  <tr key={i} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{emp.name}</td>
                    <td className="p-3 text-muted-foreground capitalize">{emp.role}</td>
                    <td className="p-3 text-center">{emp.total}</td>
                    <td className="p-3 text-center text-green-600 font-medium">{emp.approved}</td>
                    <td className="p-3 text-center text-red-500 font-medium">{emp.rejected}</td>
                    <td className="p-3 text-center">{emp.avgProgress}%</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${emp.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{emp.completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log */}
      <div className="bg-card rounded-lg border">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" /> Recent Activity
          </h2>
        </div>
        <div className="divide-y">
          {activityLog.length === 0 ? (
            <p className="p-6 text-muted-foreground text-sm">No activity yet</p>
          ) : (
            activityLog.map(item => (
              <div key={item._id} className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[item.status] || '#94a3b8' }}
                  />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.assignedTo?.name
                        ? `Assigned to ${item.assignedTo.name}`
                        : 'Unassigned'}
                      {item.updatedBy?.name
                        ? ` · Updated by ${item.updatedBy.name}`
                        : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{
                      backgroundColor: `${STATUS_COLORS[item.status]}20`,
                      color: STATUS_COLORS[item.status],
                    }}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(item.updatedAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;