import API from "../api/axios";

export const getOverview = () => API.get("/analytics/overview");
export const getTasksPerWeek = () => API.get("/analytics/tasks-per-week");
export const getEmployeePerformance = () => API.get("/analytics/employee-performance");
export const getActivityLog = () => API.get("/analytics/activity-log");