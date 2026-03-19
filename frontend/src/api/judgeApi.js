import axiosInstance from './axiosInstance';

export const onboardJudgeApi        = (eventId, data) =>
  axiosInstance.post(`/judges/events/${eventId}/onboard`, data);

export const getMyProfilesApi       = () =>
  axiosInstance.get('/judges/my');

export const getMyProfileForEventApi = (eventId) =>
  axiosInstance.get(`/judges/events/${eventId}/my-profile`);

export const getJudgesByEventApi    = (eventId) =>
  axiosInstance.get(`/judges/events/${eventId}`);