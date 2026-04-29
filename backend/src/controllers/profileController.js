import Profile from '../models/Profile.js';

const removeEmptyValues = (item) =>
  Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== '' && value !== null),
  );

const normalizeProfilePayload = (payload) => ({
  skills: Array.isArray(payload.skills)
    ? payload.skills.map((skill) => skill.trim()).filter(Boolean)
    : [],
  education: Array.isArray(payload.education)
    ? payload.education.map(removeEmptyValues)
    : [],
  experience: Array.isArray(payload.experience)
    ? payload.experience.map(removeEmptyValues)
    : [],
});

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id }).populate(
      'user',
      'name email role',
    );

    res.json({
      profile:
        profile ||
        {
          user: req.user,
          skills: [],
          education: [],
          experience: [],
        },
    });
  } catch (error) {
    next(error);
  }
};

export const upsertMyProfile = async (req, res, next) => {
  try {
    const profileData = normalizeProfilePayload(req.body);

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: profileData,
        $setOnInsert: { user: req.user._id },
      },
      { new: true, runValidators: true, upsert: true },
    ).populate('user', 'name email role');

    res.json({ profile });
  } catch (error) {
    next(error);
  }
};

export const getProfilesForRecruiters = async (req, res, next) => {
  try {
    const profiles = await Profile.find()
      .populate('user', 'name email role')
      .sort({ updatedAt: -1 });

    res.json({ profiles });
  } catch (error) {
    next(error);
  }
};
