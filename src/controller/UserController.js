export default class UserController {
  contact = async (req, res, next) => {
    try {
      res.status(200).json({
        message: 'Contact information fetched successfully',
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
