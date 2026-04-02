import API from "../api/axios";

export const getAllTasks = () => API.get("/tasks");
export const getMyTasks = () => API.get("/tasks/my");
export const getTaskById = (id) => API.get(`/tasks/${id}`);
export const createTask = (data) => API.post("/tasks", data);
export const updateProgress = (id, data) => API.patch(`/tasks/${id}/progress`, data);
export const approveTask = (id) => API.patch(`/tasks/${id}/approve`);
export const rejectTask = (id) => API.patch(`/tasks/${id}/reject`);
export const addComment = (id, data) => API.post(`/tasks/${id}/comments`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);