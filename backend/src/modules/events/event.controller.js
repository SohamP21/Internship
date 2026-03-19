import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse  from '../../utils/ApiResponse.js';
import * as eventService from './event.service.js';

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, event, 'Event created successfully'));
});

export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getAllEvents(req.user.role, req.user._id);
  res.status(200).json(new ApiResponse(200, events));
});

export const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  res.status(200).json(new ApiResponse(200, event));
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, event, 'Event updated successfully'));
});

export const transitionStatus = asyncHandler(async (req, res) => {
  const event = await eventService.transitionStatus(
    req.params.id,
    req.user._id,
    req.body.status
  );
  res.status(200).json(new ApiResponse(200, event, `Event moved to "${event.status}"`));
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, result));
});