import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    await User.findByIdAndUpdate(userId, {
      credits: 500,
    });

    // console.log(user);

    if (!user) {
      return res.status(404).json({
        message: "user does not found",
      });
    }
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: `failed to get currentUser ${error}`,
    });
  }
};
