// modules/jobs/job.dto.js

export const toJobResponse = (doc) => {
  if (!doc) return null;
  return {
    _id: doc._id,
    portalName: doc.portalName,
    companyName: doc.companyName,
    designation: doc.designation,
    salary: doc.salary,
    location: doc.location,
    experience: doc.experience,
    skills: doc.skills,
    applyUrl: doc.applyUrl,
    easyApply: doc.easyApply === true,
    emailDate: doc.emailDate,
  };
};

export const toJobListResponse = (docs) => docs.map(toJobResponse);
