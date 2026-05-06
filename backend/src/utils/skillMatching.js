export const normalizeSkills = (skills = []) =>
  skills.map((skill) => skill.trim().toLowerCase()).filter(Boolean);

export const calculateMatch = (profileSkills, jobSkills) => {
  const normalizedProfileSkills = new Set(normalizeSkills(profileSkills));
  const normalizedJobSkills = normalizeSkills(jobSkills);

  if (normalizedJobSkills.length === 0) {
    return {
      matchedSkills: [],
      matchPercentage: 0,
    };
  }

  const matchedSkills = normalizedJobSkills.filter((skill) =>
    normalizedProfileSkills.has(skill),
  );

  return {
    matchedSkills,
    matchPercentage: Math.round(
      (matchedSkills.length / normalizedJobSkills.length) * 100,
    ),
  };
};
