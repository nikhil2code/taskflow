import API from "../api/axios";

export const getTeams = () => API.get("/teams");
export const createTeam = (data) => API.post("/teams", data);
export const updateTeam = (id, data) => API.patch(`/teams/${id}`, data);
export const deleteTeam = (id) => API.delete(`/teams/${id}`);