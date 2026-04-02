import API from "../api/axios";

export const getNotifications = () => API.get("/notifications");
export const markAsRead = (id) => API.patch(`/notifications/${id}/read`);
export const markAllAsRead = () => API.patch("/notifications/read-all");