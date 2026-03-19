import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse  from '../../utils/ApiResponse.js';
import * as registrationService from './registration.service.js';

export const registerTeam = asyncHandler(async (req, res) => {
  // req.body comes as multipart/form-data so JSON fields need parsing
  const body = {
    teamName:   req.body.teamName,
    domains:    JSON.parse(req.body.domains   || '[]'),
    members:    JSON.parse(req.body.members   || '[]'),
    githubLink: req.body.githubLink || '',
    driveLink:  req.body.driveLink  || '',
  };

  const registration = await registrationService.registerTeam({
    eventId:    req.params.eventId,
    teamLeadId: req.user._id,
    body,
    files:      req.files,
  });

  res.status(201).json(new ApiResponse(201, registration, 'Team registered successfully'));
});

export const getRegistrationsByEvent = asyncHandler(async (req, res) => {
  const registrations = await registrationService.getRegistrationsByEvent(
    req.params.eventId,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, registrations));
});

export const getMyRegistrations = asyncHandler(async (req, res) => {
  const registrations = await registrationService.getMyRegistrations(req.user._id);
  res.status(200).json(new ApiResponse(200, registrations));
});

export const getRegistrationById = asyncHandler(async (req, res) => {
  const registration = await registrationService.getRegistrationById(
    req.params.id,
    req.user._id,
    req.user.role
  );
  res.status(200).json(new ApiResponse(200, registration));
});