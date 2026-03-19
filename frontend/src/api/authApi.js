import axiosInstance from './axiosInstance';

export const registerApi  = (data)  => axiosInstance.post('/auth/register', data);
export const loginApi     = (data)  => axiosInstance.post('/auth/login', data);
export const verifyEmailApi = (token, id) =>
  axiosInstance.get(`/auth/verify-email?token=${token}&id=${id}`);
export const getMeApi     = ()      => axiosInstance.get('/auth/me');