import { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../api/profile.js';
import { SkeletonCard } from '../components/Skeleton.jsx';

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
  const [contactDetails, setContactDetails] = useState({
    phone: '',
    alternateEmail: '',
  });
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
        setContactDetails({
          phone: profile.contactDetails?.phone || '',
          alternateEmail: profile.contactDetails?.alternateEmail || '',
        });
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
      const { profile } = await updateMyProfile({
        contactDetails,
        skills: skillsText.split(',').map((skill) => skill.trim()).filter(Boolean),
        education: education.filter((item) => item.institution || item.degree),
        experience: experience.filter((item) => item.company || item.title),
      });
      setContactDetails({
        phone: profile.contactDetails?.phone || '',
        alternateEmail: profile.contactDetails?.alternateEmail || '',
      });
      setStatus('Profile saved successfully');
    } catch (profileError) {
      setError(profileError.message);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Profile</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Keep your skills, education, and experience current so matching and recruiter review stay useful.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Contact Details</p>
          <p className="mt-2 text-2xl font-bold">
            {Object.values(contactDetails).filter(Boolean).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Skills</p>
          <p className="mt-2 text-2xl font-bold">
            {skillsText.split(',').map((skill) => skill.trim()).filter(Boolean).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Education Entries</p>
          <p className="mt-2 text-2xl font-bold">
            {education.filter((item) => item.institution || item.degree).length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
          <p className="text-sm text-slate-500 dark:text-slate-400">Experience Entries</p>
          <p className="mt-2 text-2xl font-bold">
            {experience.filter((item) => item.company || item.title).length}
          </p>
        </div>
      </div>

      <form
        className="space-y-6 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"
        onSubmit={handleSubmit}
      >
        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}
        {status ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {status}
          </div>
        ) : null}

        <div className="grid gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Details</h2>
            <div className="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:grid-cols-2 dark:border-white/10 dark:bg-slate-900">
              <input
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                onChange={(event) =>
                  setContactDetails((current) => ({ ...current, phone: event.target.value }))
                }
                placeholder="Phone number"
                value={contactDetails.phone}
              />
              <input
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                onChange={(event) =>
                  setContactDetails((current) => ({ ...current, alternateEmail: event.target.value }))
                }
                placeholder="Alternate email"
                type="email"
                value={contactDetails.alternateEmail}
              />
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Skills
            </span>
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder="React, Node.js, MongoDB"
              value={skillsText}
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Education</h2>
            <button
              className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              onClick={() => setEducation((items) => [...items, emptyEducation])}
              type="button"
            >
              Add education
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {education.map((item, index) => (
              <div
                className="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:grid-cols-2 dark:border-white/10 dark:bg-slate-900"
                key={index}
              >
                {['institution', 'degree', 'fieldOfStudy', 'startYear', 'endYear'].map(
                  (field) => (
                    <input
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
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

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Experience</h2>
            <button
              className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
              onClick={() => setExperience((items) => [...items, emptyExperience])}
              type="button"
            >
              Add experience
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {experience.map((item, index) => (
              <div
                className="grid gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 sm:grid-cols-2 dark:border-white/10 dark:bg-slate-900"
                key={index}
              >
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'company', event.target.value)
                  }
                  placeholder="company"
                  value={item.company || ''}
                />
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'title', event.target.value)
                  }
                  placeholder="title"
                  value={item.title || ''}
                />
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'startDate', event.target.value)
                  }
                  type="date"
                  value={item.startDate || ''}
                />
                <input
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  onChange={(event) =>
                    updateListItem(setExperience, index, 'endDate', event.target.value)
                  }
                  type="date"
                  value={item.endDate || ''}
                />
                <textarea
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-slate-950 outline-none ring-emerald-400 transition focus:ring-2 sm:col-span-2 dark:border-white/10 dark:bg-slate-950 dark:text-white"
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
          className="w-full rounded-full bg-emerald-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-emerald-300"
          type="submit"
        >
          Save profile
        </button>
      </form>
    </section>
  );
}

export default Profile;
