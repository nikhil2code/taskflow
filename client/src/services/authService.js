import API from "../api/axios";

export const loginUser = (data) => API.post("/auth/login", data);
export const registerUser = (data) => API.post("/auth/register", data);
export const getMe = () => API.get("/auth/me");
export const getAllUsers = () => API.get("/auth/users");