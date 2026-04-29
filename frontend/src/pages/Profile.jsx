import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../api/profile.js';

const emptyEducation = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
};

const emptyExperience = {
  company: '',
  title: '',
  startDate: '',
  endDate: '',
  description: '',
};

const toDateInput = (date) => (date ? String(date).slice(0, 10) : '');

function Profile() {
  const [skillsText, setSkillsText] = useState('');
  const [education, setEducation] = useState([emptyEducation]);
  const [experience, setExperience] = useState([emptyExperience]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { profile } = await getMyProfile();
        setSkillsText((profile.skills || []).join(', '));
        setEducation(profile.education?.length ? profile.education : [emptyEducation]);
        setExperience(
          profile.experience?.length
            ? profile.experience.map((item) => ({
                ...item,
                startDate: toDateInput(item.startDate),
                endDate: toDateInput(item.endDate),
              }))
            : [emptyExperience],
        );
      } catch (profileError) {
        setError(profileError.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateListItem = (setter, index, field, value) => {
    setter((items) =>
      items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    try {
      await updateMyProfile({
        skills: skillsText.split(',').map((skill) => skill.trim()).filter(Boolean),
        education: education.filter((item) => item.institution || item.degree),
        experience: experience.filter((item) => item.company || item.title),
      });
      setStatus('Profile saved successfully');
    } catch (profileError) {
      setError(profileError.message);
    }
  };

  if (isLoading) {
    return <p className="text-slate-300">Loading profile...</p>;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">Edit Profile</h1>
      <form
        className="mt-6 space-y-6 rounded-lg border border-white/10 bg-white/[0.04] p-6"
        onSubmit={handleSubmit}
      >
        {error ? (
          <div className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {status ? (
          <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {status}
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-slate-200">Skills</span>
          <input
            className="mt-2 w-full rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
            onChange={(event) => setSkillsText(event.target.value)}
            placeholder="React, Node.js, MongoDB"
            value={skillsText}
          />
        </label>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Education</h2>
            <button
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              onClick={() => setEducation((items) => [...items, emptyEducation])}
              type="button"
            >
              Add education
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {education.map((item, index) => (
              <div className="grid gap-3 rounded-md bg-slate-900 p-4 sm:grid-cols-2" key={index}>
                {['institution', 'degree', 'fieldOfStudy', 'startYear', 'endYear'].map(
                  (field) => (
                    <input
                      className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
                      key={field}
                      onChange={(event) =>
                        updateListItem(setEducation, index, field, event.target.value)
                      }
                      placeholder={field}
                      type={field.includes('Year') ? 'number' : 'text'}
                      value={item[field] || ''}
                    />
                  ),
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Experience</h2>
            <button
              className="rounded-md border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
              onClick={() => setExperience((items) => [...items, emptyExperience])}
              type="button"
            >
              Add experience
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {experience.map((item, index) => (
              <div className="grid gap-3 rounded-md bg-slate-900 p-4 sm:grid-cols-2" key={index}>
                <input
                  className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'company', event.target.value)
                  }
                  placeholder="company"
                  value={item.company || ''}
                />
                <input
                  className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'title', event.target.value)
                  }
                  placeholder="title"
                  value={item.title || ''}
                />
                <input
                  className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'startDate', event.target.value)
                  }
                  type="date"
                  value={item.startDate || ''}
                />
                <input
                  className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'endDate', event.target.value)
                  }
                  type="date"
                  value={item.endDate || ''}
                />
                <textarea
                  className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none ring-emerald-400 transition focus:ring-2 sm:col-span-2"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'description', event.target.value)
                  }
                  placeholder="description"
                  rows="3"
                  value={item.description || ''}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          className="w-full rounded-md bg-emerald-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-300"
          type="submit"
        >
          Save profile
        </button>
      </form>
    </section>
  );
}

export default Profile;
