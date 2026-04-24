import API from "../api/axios";

export const setup2FA = () => API.post("/2fa/setup");
export const verifyAndEnable2FA = (token) => API.post("/2fa/verify-setup", { token });
export const disable2FA = (token) => API.post("/2fa/disable", { token });
export const validate2FA = (email, token) => API.post("/2fa/validate", { email, token });
export const getSessions = () => API.get("/2fa/sessions");
export const deleteSession = (sessionId) => API.delete(`/2fa/sessions/${sessionId}`);
export const deleteAllSessions = () => API.delete("/2fa/sessions");