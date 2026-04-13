import axiosInstance from './axiosInstance';

export const getMyCertificatesApi = () => axiosInstance.get('/certificates/my');

export const downloadCertificateApi = async (certificateId) => {
  const res = await axiosInstance.get(`/certificates/download/${certificateId}`, {
    responseType: 'blob',
  });
  return res.data;
};
