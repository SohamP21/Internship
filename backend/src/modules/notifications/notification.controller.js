import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse from '../../utils/ApiResponse.js';
import * as notificationService from './notification.service.js';

export const getRecent = asyncHandler(async (req, res) => {
  const items = await notificationService.getRecentForUser(req.user._id, 10);
  const unreadCount = await notificationService.countUnread(req.user._id);
  res.status(200).json(new ApiResponse(200, { items, unreadCount }));
});

export const markOneRead = asyncHandler(async (req, res) => {
  await notificationService.markRead(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, { ok: true }));
});

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user._id);
  res.status(200).json(new ApiResponse(200, { ok: true }));
});
