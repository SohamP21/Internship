import axiosInstance from './axiosInstance';

/** Normalizes `{ data: T }` (ApiResponse) or bare `T` from axios. */
export const unwrapApiData = (res) => {
  const body = res?.data;
  if (body == null) return null;
  return body.data !== undefined ? body.data : body;
};

/** Login/register responses always include token + user in the inner payload. */
export const parseLoginPayload = (res) => {
  const data = unwrapApiData(res);
  if (data?.token && data?.user) return data;
  return null;
};

export const registerApi = (data) => axiosInstance.post('/auth/register', data);
export const loginApi = (data) => axiosInstance.post('/auth/login', data);
export const verifyEmailApi = (token, id) =>
  axiosInstance.get(`/auth/verify-email?token=${token}&id=${id}`);
export const getMeApi = () => axiosInstance.get('/auth/me');
export const updateMeApi = (data) => axiosInstance.patch('/auth/me', data);