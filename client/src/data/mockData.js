export const mockUsers = [
  { id: '1', name: 'Sarah Chen', email: 'sarah@taskflow.com', role: 'manager', department: 'Engineering' },
  { id: '2', name: 'James Wilson', email: 'james@taskflow.com', role: 'team_lead', department: 'Engineering' },
  { id: '3', name: 'Emily Davis', email: 'emily@taskflow.com', role: 'employee', department: 'Engineering' },
  { id: '4', name: 'Michael Brown', email: 'michael@taskflow.com', role: 'employee', department: 'Design' },
  { id: '5', name: 'Lisa Park', email: 'lisa@taskflow.com', role: 'employee', department: 'Engineering' },
];

export const mockTasks = [
  {
    id: 't1', title: 'Implement User Authentication API', description: 'Build JWT-based auth endpoints including login, register, and token refresh. Include rate limiting and input validation.',
    status: 'in_progress', priority: 'high', progress: 65,
    assignedTo: '3', assignedBy: '1', deadline: '2026-03-25',
    createdAt: '2026-03-10', updatedAt: '2026-03-15', comments: [], attachments: [],
  },
  {
    id: 't2', title: 'Design Dashboard Wireframes', description: 'Create hi-fi wireframes for the manager and employee dashboards. Include responsive breakpoints.',
    status: 'submitted', priority: 'medium', progress: 100,
    assignedTo: '4', assignedBy: '2', deadline: '2026-03-20',
    createdAt: '2026-03-08', updatedAt: '2026-03-16', comments: [], attachments: [],
  },
  {
    id: 't3', title: 'Set Up CI/CD Pipeline', description: 'Configure GitHub Actions for automated testing, linting, and deployment to staging environment.',
    status: 'assigned', priority: 'high', progress: 0,
    assignedTo: '5', assignedBy: '1', deadline: '2026-03-28',
    createdAt: '2026-03-15', updatedAt: '2026-03-15', comments: [], attachments: [],
  },
  {
    id: 't4', title: 'Write Unit Tests for Task Module', description: 'Achieve 80% coverage on the task management module. Include edge cases for status transitions.',
    status: 'approved', priority: 'medium', progress: 100,
    assignedTo: '3', assignedBy: '2', deadline: '2026-03-18',
    createdAt: '2026-03-05', updatedAt: '2026-03-17', comments: [], attachments: [],
  },
  {
    id: 't5', title: 'Optimize Database Queries', description: 'Review and optimize slow queries identified in APM. Target < 100ms response time.',
    status: 'rejected', priority: 'urgent', progress: 45,
    assignedTo: '5', assignedBy: '1', deadline: '2026-03-22',
    createdAt: '2026-03-12', updatedAt: '2026-03-16', comments: [], attachments: [],
  },
  {
    id: 't6', title: 'Create Notification System', description: 'Build real-time notification system for task events using WebSockets.',
    status: 'in_progress', priority: 'high', progress: 30,
    assignedTo: '4', assignedBy: '1', deadline: '2026-03-30',
    createdAt: '2026-03-14', updatedAt: '2026-03-17', comments: [], attachments: [],
  },
];

export const mockNotifications = [
  { id: 'n1', userId: '3', message: 'You have been assigned "Implement User Authentication API"', type: 'task_assigned', read: false, createdAt: '2026-03-15T10:00:00', taskId: 't1' },
  { id: 'n2', userId: '1', message: 'Emily Davis submitted "Design Dashboard Wireframes"', type: 'task_submitted', read: false, createdAt: '2026-03-16T14:30:00', taskId: 't2' },
  { id: 'n3', userId: '5', message: 'Your task "Optimize Database Queries" was rejected', type: 'task_rejected', read: true, createdAt: '2026-03-16T16:00:00', taskId: 't5' },
  { id: 'n4', userId: '3', message: 'Your task "Write Unit Tests" was approved!', type: 'task_approved', read: true, createdAt: '2026-03-17T09:00:00', taskId: 't4' },
];
