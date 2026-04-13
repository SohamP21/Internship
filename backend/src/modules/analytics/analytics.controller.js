import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as analyticsService from './analytics.service.js';

export const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCoordinatorOverview(req.user._id);
  res.status(200).json(new ApiResponse(200, data));
});
