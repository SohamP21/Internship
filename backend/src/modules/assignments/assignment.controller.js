import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse  from '../../utils/ApiResponse.js';
import * as assignmentService from './assignment.service.js';

export const assignTeam = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.assignTeam({
    eventId:        req.params.eventId,
    registrationId: req.body.registrationId,
    judgeId:        req.body.judgeId,
    coordinatorId:  req.user._id,
  });
  res.status(201).json(new ApiResponse(201, assignment, 'Team assigned successfully'));
});

export const removeAssignment = asyncHandler(async (req, res) => {
  const result = await assignmentService.removeAssignment({
    assignmentId:  req.params.assignmentId,
    coordinatorId: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, result));
});

export const getAssignmentBoard = asyncHandler(async (req, res) => {
  const board = await assignmentService.getAssignmentBoard({
    eventId:       req.params.eventId,
    coordinatorId: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, board));
});

export const getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await assignmentService.getMyAssignments({
    judgeId: req.user._id,
    eventId: req.params.eventId,
  });
  res.status(200).json(new ApiResponse(200, assignments));
});