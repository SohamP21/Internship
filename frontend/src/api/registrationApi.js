import axiosInstance from './axiosInstance';

// FormData is used because we're sending files alongside JSON data
export const registerTeamApi = (eventId, formData) =>
  axiosInstance.post(`/registrations/events/${eventId}/register`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getMyRegistrationsApi = () =>
  axiosInstance.get('/registrations/my');

export const getRegistrationsByEventApi = (eventId) =>
  axiosInstance.get(`/registrations/events/${eventId}`);

export const getRegistrationByIdApi = (id) =>
  axiosInstance.get(`/registrations/${id}`);