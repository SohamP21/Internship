import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse  from '../../utils/ApiResponse.js';
import * as judgeService from './judge.service.js';

export const onboardJudge = asyncHandler(async (req, res) => {
  const profile = await judgeService.onboardJudge({
    judgeId:    req.user._id,
    eventId:    req.params.eventId,
    domains:    req.body.domains,
    slotNumber: req.body.slotNumber,
  });
  res.status(201).json(new ApiResponse(201, profile, 'Successfully signed up to judge'));
});

export const getMyProfiles = asyncHandler(async (req, res) => {
  const profiles = await judgeService.getMyProfiles(req.user._id);
  res.status(200).json(new ApiResponse(200, profiles));
});

export const getMyProfileForEvent = asyncHandler(async (req, res) => {
  const profile = await judgeService.getMyProfileForEvent(
    req.user._id,
    req.params.eventId
  );
  res.status(200).json(new ApiResponse(200, profile));
});

export const getJudgesByEvent = asyncHandler(async (req, res) => {
  const judges = await judgeService.getJudgesByEvent(
    req.params.eventId,
    req.user._id
  );
  res.status(200).json(new ApiResponse(200, judges));
});