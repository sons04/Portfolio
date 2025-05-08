// src/components/AboutExperienceEducation.jsx
import React from 'react';

const AboutExperienceEducation = () => {
  return (
    <section id="about-experience-education" className="flex flex-col md:flex-row justify-center items-start gap-16 mb-20 fade-in">

      {/* Experience */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">Experience</h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-lg">Cybersecurity Engineer | CrowdStrike Partner</h3>
            <p className="text-gray-400 text-sm">2022–Present</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Developer & Consultant (Freelance)</h3>
            <p className="text-gray-400 text-sm">2020–Present</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Junior Developer | ABC Company</h3>
            <p className="text-gray-400 text-sm">2017–2019</p>
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="flex-1 text-center md:text-left">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400">Education</h2>
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-lg">Double Bachelor's Degree</h3>
            <p className="text-gray-400 text-sm">
              Computer Engineering (IT) & Telecom Systems Engineering<br/>
              UAB (2016–2021)
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-lg">Bachelor of Computer Engineering (Exchange)</h3>
            <p className="text-gray-400 text-sm">
              University of Western Australia (2019–2020)
            </p>
          </div>
        </div>
      </div>

    </section>
  );
};

export default AboutExperienceEducation;
