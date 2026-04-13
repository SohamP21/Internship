import axiosInstance from './axiosInstance';

export const getAnalyticsOverviewApi = () => axiosInstance.get('/analytics/overview');
