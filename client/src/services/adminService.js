import API from "../api/axios";

export const getAllUsers = () => API.get("/admin/users");
export const updateUserRole = (id, role) => API.patch(`/admin/users/${id}/role`, { role });
export const deactivateUser = (id) => API.patch(`/admin/users/${id}/deactivate`);
export const activateUser = (id) => API.patch(`/admin/users/${id}/activate`);
export const sendInvite = (email, role) => API.post("/invite", { email, role });