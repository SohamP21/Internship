import axiosInstance from './axiosInstance';

export const createEventApi      = (data)       => axiosInstance.post('/events', data);
export const getAllEventsApi      = ()           => axiosInstance.get('/events');
export const getEventByIdApi      = (id)         => axiosInstance.get(`/events/${id}`);
export const updateEventApi       = (id, data)   => axiosInstance.put(`/events/${id}`, data);
export const transitionStatusApi  = (id, status) => axiosInstance.patch(`/events/${id}/status`, { status });
export const extendRegistrationDeadlineApi = (id, registrationDeadline) =>
  axiosInstance.patch(`/events/${id}/registration-deadline`, { registrationDeadline });
export const deleteEventApi       = (id)         => axiosInstance.delete(`/events/${id}`);

/** Sidebar + control panel (optional eventId for coordinator/judge scoped metrics). */
export const getOpsSummaryApi = (eventId) =>
  axiosInstance.get('/events/summary/ops', {
    params: eventId ? { eventId } : {},
  });