import configuration from '../../config/config.js';
import user from '../../models/userModel.js';
import verifyToken from '../../utils/tokenVerifier.js';

export default class TokenValidation {
  accessTokenValidator = async (req, res, next) => {
    try {
      const decoded = verifyToken(req, res, configuration.ACCESS_SECRET);
      const appUser = await user.findOne({
        _id: decoded.userId,
      });

      if (!appUser) {
        res.status(401);
        throw new Error('User Does Not Exists');
      }

      if (appUser.isDeleted) {
        res.status(401);

        throw new Error('User Deleted. Logging Out!');
      }

      if (appUser.isBlocked && !appUser.isAdmin) {
        res.status(401);

        throw new Error('User Blocked. Logging Out!');
      }


      req.user = appUser;

      next();
    } catch (err) {
      if (err.message === 'jwt expired' || err.message === 'jwt malformed') {
        res.status(401);
      }

      next(err);
    }
  };

  refreshTokenValidator = async (req, res, next) => {
    try {
      const decoded = verifyToken(req, res, configuration.REFRESH_SECRET);
      const appUser = await user.findOne({ _id: decoded.userId });
      const expiryTime = new Date(appUser?.validTill);
      const now = new Date();

      if (!appUser) {
        res.status(401);
        throw new Error('User does not exists');
      }

      if (appUser.isDeleted) {
        res.status(401);

        throw new Error('User Deleted. Logging Out!');
      }

      if (appUser.isBlocked && !appUser.isAdmin) {
        res.status(401);

        throw new Error('User Blocked. Logging Out!');
      }

        req.user = appUser;

        next();
    } catch (err) {
      if (err.message == 'jwt expired' || err.message === 'jwt malformed') {
        res.status(401);
      }

      next(err);
    }
  };
}
