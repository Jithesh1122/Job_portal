export const registerUser = (req, res) => {
  res.status(201).json({
    message: 'Register route ready',
    data: req.body,
  });
};

export const loginUser = (req, res) => {
  res.json({
    message: 'Login route ready',
    data: req.body,
  });
};

export const getUserProfile = (req, res) => {
  res.json({
    message: 'User profile route ready',
  });
};
