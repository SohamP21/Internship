import axiosInstance from './axiosInstance';

export const getRecentNotificationsApi = () => axiosInstance.get('/notifications/recent');

export const markNotificationReadApi = (id) => axiosInstance.patch(`/notifications/${id}/read`);

export const markAllNotificationsReadApi = () => axiosInstance.patch('/notifications/read-all');
