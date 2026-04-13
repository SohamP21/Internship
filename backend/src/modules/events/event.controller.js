import asyncHandler from '../../utils/asyncHandler.js';
import ApiResponse  from '../../utils/ApiResponse.js';
import * as eventService from './event.service.js';
import * as eventOpsService from './event.ops.service.js';

export const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, event, 'Event created successfully'));
});

export const getAllEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getAllEvents(req.user.role, req.user._id);
  res.status(200).json(new ApiResponse(200, events));
});

/** Sidebar + control panel: optional ?eventId= for scoped metrics (coordinator / judge). */
export const getOpsSummary = asyncHandler(async (req, res) => {
  const eventId = req.query.eventId || null;
  const data = await eventOpsService.getOpsSummary({ user: req.user, eventId });
  res.status(200).json(new ApiResponse(200, data));
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
  const { event, certificateIssuance } = await eventService.transitionStatus(
    req.params.id,
    req.user._id,
    req.body.status
  );
  res.status(200).json(
    new ApiResponse(
      200,
      { event, certificateIssuance },
      `Event moved to "${event.status}"`
    )
  );
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, result));
});

export const extendRegistrationDeadline = asyncHandler(async (req, res) => {
  const event = await eventService.extendRegistrationDeadline(
    req.params.id,
    req.user._id,
    req.body.registrationDeadline
  );
  res.status(200).json(new ApiResponse(200, event, 'Registration deadline updated'));
});