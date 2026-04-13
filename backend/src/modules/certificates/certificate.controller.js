import fs from 'fs';
import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';
import * as certificateService from './certificate.service.js';

export const getMyCertificates = asyncHandler(async (req, res) => {
  const rows = await certificateService.listCertificatesForStudent(req.user._id);
  const data = rows.map((c) => ({
    certificateId: c.certificateId,
    studentName: c.studentName,
    eventName: c.eventName,
    eventDate: c.eventDate,
    rank: c.rank,
    issuedAt: c.issuedAt,
    eventId: c.eventId,
  }));
  res.status(200).json(new ApiResponse(200, data));
});

export const downloadCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const result = await certificateService.getCertificateFilePathForOwner(certificateId, req.user._id);
  if (!result) {
    throw new ApiError(404, 'Certificate not found or access denied');
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="Certificate.pdf"');
  fs.createReadStream(result.absPath).pipe(res);
});

export const verifyCertificate = asyncHandler(async (req, res) => {
  const { certificateId } = req.params;
  const cert = await certificateService.getCertificateByPublicId(certificateId);
  if (!cert) {
    throw new ApiError(404, 'Certificate not found');
  }
  res.status(200).json(
    new ApiResponse(200, {
      studentName: cert.studentName,
      eventName: cert.eventName,
      date: cert.eventDate,
      rank: cert.rank,
      issuedAt: cert.issuedAt,
    })
  );
});
