// Role hierarchy levels
export const ROLE_LEVELS = {
  admin: 5,
  bod: 4,
  manager: 3,
  teamlead: 2,
  employee: 1
};

// Permission definitions
export const PERMISSIONS = {
  // Admin only
  MANAGE_USERS: ['admin'],
  MANAGE_ROLES: ['admin'],
  VIEW_ALL_DATA: ['admin', 'bod'],
  
  // Task permissions
  CREATE_TASK: ['admin', 'bod', 'manager', 'teamlead'],
  EDIT_TASK: ['admin', 'bod', 'manager', 'teamlead'],
  DELETE_TASK: ['admin', 'bod', 'manager'],
  ASSIGN_TASK: ['admin', 'bod', 'manager', 'teamlead'],
  APPROVE_TASK: ['admin', 'bod', 'manager', 'teamlead'],
  
  // View permissions
  VIEW_OWN_TASKS: ['admin', 'bod', 'manager', 'teamlead', 'employee'],
  VIEW_TEAM_TASKS: ['admin', 'bod', 'manager', 'teamlead'],
  VIEW_ALL_TASKS: ['admin', 'bod'],
  
  // User management
  APPROVE_REGISTRATIONS: ['admin'],
  MANAGE_TEAM: ['admin', 'bod', 'manager'],
  
  // Profile
  EDIT_PROFILE: ['admin', 'bod', 'manager', 'teamlead', 'employee'],
  CHANGE_PASSWORD: ['admin', 'bod', 'manager', 'teamlead', 'employee']
};

// Check if user has permission
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};

// Check if user can assign a role to another user
export const canAssignRole = (currentUserRole, targetRole) => {
  const currentLevel = ROLE_LEVELS[currentUserRole];
  const targetLevel = ROLE_LEVELS[targetRole];
  return currentLevel > targetLevel;
};

// Check if user can assign task to another user
export const canAssignTask = (assignerRole, assigneeRole) => {
  const assignerLevel = ROLE_LEVELS[assignerRole];
  const assigneeLevel = ROLE_LEVELS[assigneeRole];
  return assignerLevel > assigneeLevel;
};

// Get available roles for user to assign
export const getAssignableRoles = (currentUserRole) => {
  const currentLevel = ROLE_LEVELS[currentUserRole];
  const allRoles = Object.entries(ROLE_LEVELS);
  
  return allRoles
    .filter(([role, level]) => level < currentLevel && role !== 'admin')
    .map(([role]) => role);
};

// Sidebar menu items based on role
export const getSidebarMenu = (userRole) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'LayoutDashboard', roles: ['admin', 'bod', 'manager', 'teamlead', 'employee'] },
    { name: 'My Tasks', path: '/my-tasks', icon: 'ListTodo', roles: ['admin', 'bod', 'manager', 'teamlead', 'employee'] },
  ];
  
  // Add role-specific menu items
  if (hasPermission(userRole, 'CREATE_TASK')) {
    menuItems.push({ name: 'Create Task', path: '/create-task', icon: 'PlusCircle', roles: ['admin', 'bod', 'manager', 'teamlead'] });
  }
  
  if (hasPermission(userRole, 'VIEW_ALL_TASKS')) {
    menuItems.push({ name: 'All Tasks', path: '/all-tasks', icon: 'ClipboardList', roles: ['admin', 'bod'] });
  }
  
  if (hasPermission(userRole, 'MANAGE_TEAM')) {
    menuItems.push({ name: 'Team', path: '/team', icon: 'Users', roles: ['admin', 'bod', 'manager'] });
  }
  
  if (userRole === 'admin') {
    menuItems.push({ name: 'Admin Panel', path: '/admin', icon: 'Shield', roles: ['admin'] });
  }
  
  menuItems.push({ name: 'Profile', path: '/profile', icon: 'User', roles: ['admin', 'bod', 'manager', 'teamlead', 'employee'] });
  
  return menuItems.filter(item => item.roles.includes(userRole));
};