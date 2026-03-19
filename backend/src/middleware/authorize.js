import ApiError from '../utils/ApiError.js';

// Usage: authorize('coordinator')  or  authorize('coordinator', 'judge')
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, `Access denied for role: ${req.user.role}`);
  }
  next();
};

export default authorize;