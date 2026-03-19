import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse  from '../../utils/ApiResponse.js';
import * as evaluationService from './evaluation.service.js';

export const submitEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await evaluationService.submitEvaluation({
    assignmentId: req.params.assignmentId,
    judgeId:      req.user._id,
    scores:       req.body.scores,
    remarks:      req.body.remarks,
  });
  res.status(201).json(new ApiResponse(201, evaluation, 'Evaluation submitted successfully'));
});

export const getJudgeAssignmentsWithStatus = asyncHandler(async (req, res) => {
  const assignments = await evaluationService.getJudgeAssignmentsWithStatus({
    judgeId: req.user._id,
    eventId: req.params.eventId,
  });
  res.status(200).json(new ApiResponse(200, assignments));
});

export const getEvaluationByAssignment = asyncHandler(async (req, res) => {
  const evaluation = await evaluationService.getEvaluationByAssignment({
    assignmentId: req.params.assignmentId,
    judgeId:      req.user._id,
  });
  res.status(200).json(new ApiResponse(200, evaluation));
});

export const getEventResults = asyncHandler(async (req, res) => {
  const results = await evaluationService.getEventResults({
    eventId:       req.params.eventId,
    coordinatorId: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, results));
});
export const getMyScore = asyncHandler(async (req, res) => {
  const result = await evaluationService.getMyScore({
    registrationId: req.params.registrationId,
    teamLeadId:     req.user._id,
  });
  res.status(200).json(new ApiResponse(200, result));
});