// src/components/About.jsx
import React from 'react';

const About = () => {
  return (
    <section id="about" className="text-center mb-20 fade-in">
      <h2 className="text-4xl font-bold mb-6 text-indigo-400">About Me</h2>
      <p className="text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
        Hello, I'm <span className="text-white font-semibold">Sergio Acosta Piñero</span>,
        a Software Developer and Consultant specializing in intuitive and dynamic web applications,
        information technologies, cybersecurity, and Web3 systems.  
        I hold a Double Bachelor's Degree in Computer Engineering (IT) and Telecom Systems Engineering,
        complemented by international studies in Australia.  
        I’m passionate about delivering secure, scalable, and innovative digital solutions.
      </p>
    </section>
  );
};

export default About;
