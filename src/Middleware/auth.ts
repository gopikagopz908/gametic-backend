import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { CustomError } from '../utils/customError';
import User from '../Model/userModel';


interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: string | undefined;
  };
}

interface CustomJwtPayload extends JwtPayload {
  userId: string;
  role: string;
  id?: string;
}

const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return next(new CustomError('Not authenticated', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;

    console.log(decoded,"decodeee")
    const userId = decoded.userId || decoded.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return next(new CustomError('User not found', 404));
    }

    if (user.isBlocked) {
      return next(new CustomError('User is blocked. Please contact support.', 403));
    }

    req.user = {
      userId: user._id.toString(),
      role: user.role,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(
        new CustomError('Access token expired, please refresh your token', 401)
      );
    }
    return next(new CustomError('Not authorized, token invalid', 401));
  }
};


const verifyOwner = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return next(new CustomError('Unauthorized: No token provided', 401));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as CustomJwtPayload;

    if (payload.role !== 'owner') {
      return next(new CustomError('Forbidden: Owner role required', 403));
    }

    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return next(new CustomError('Unauthorized: Invalid token', 401));
  }
};

const verifyAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    return next(new CustomError('Access denied, only admins can access this', 403));
  }
};

export { authMiddleware , verifyOwner, verifyAdmin, AuthenticatedRequest };
