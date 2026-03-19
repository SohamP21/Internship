import axiosInstance from './axiosInstance';

export const submitEvaluationApi = (assignmentId, data) =>
  axiosInstance.post(`/evaluations/assignments/${assignmentId}`, data);

export const getJudgeAssignmentsApi = (eventId) =>
  axiosInstance.get(`/evaluations/events/${eventId}/my-assignments`);

export const getMyEvaluationApi = (assignmentId) =>
  axiosInstance.get(`/evaluations/assignments/${assignmentId}/my`);

export const getEventResultsApi = (eventId) =>
  axiosInstance.get(`/evaluations/events/${eventId}/results`);

export const getMyScoreApi = (registrationId) =>
  axiosInstance.get(`/evaluations/registrations/${registrationId}/my-score`);