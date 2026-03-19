import axiosInstance from './axiosInstance';

export const getAssignmentBoardApi = (eventId) =>
  axiosInstance.get(`/assignments/events/${eventId}/board`);

export const assignTeamApi = (eventId, data) =>
  axiosInstance.post(`/assignments/events/${eventId}`, data);

export const removeAssignmentApi = (assignmentId) =>
  axiosInstance.delete(`/assignments/${assignmentId}`);

export const getMyAssignmentsApi = (eventId) =>
  axiosInstance.get(`/assignments/events/${eventId}/my`);