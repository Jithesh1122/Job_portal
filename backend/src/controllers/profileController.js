import Profile from '../models/Profile.js';
import { isValidEmail, normalizeString } from '../utils/validation.js';

const removeEmptyValues = (item) =>
  Object.fromEntries(
    Object.entries(item).filter(([, value]) => value !== '' && value !== null),
  );

const parseJsonField = (value, fallback) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return fallback;
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
};

const normalizeProfilePayload = (payload) => {
  const contactSource = payload.contactDetails || payload;

  return {
    contactDetails: removeEmptyValues({
      phone: normalizeString(contactSource.phone),
      alternateEmail: normalizeString(contactSource.alternateEmail).toLowerCase(),
    }),
    skills: parseJsonField(payload.skills, [])
      .map((skill) => String(skill).trim())
      .filter(Boolean),
    education: parseJsonField(payload.education, [])
      .map(removeEmptyValues),
    experience: parseJsonField(payload.experience, [])
      .map(removeEmptyValues),
  };
};

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
          contactDetails: {},
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

    if (
      profileData.contactDetails.alternateEmail &&
      !isValidEmail(profileData.contactDetails.alternateEmail)
    ) {
      res.status(400);
      throw new Error('Please enter a valid alternate email address');
    }

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
      .populate({
        path: 'user',
        select: 'name email role',
        match: { role: 'candidate' },
      })
      .sort({ updatedAt: -1 });

    res.json({ profiles: profiles.filter((profile) => profile.user) });
  } catch (error) {
    next(error);
  }
};
