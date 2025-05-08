// src/components/Projects.jsx
import React from "react";

const projects = [
  {
    title: "Ecobertura Website",
    description: "Official website promoting sustainable environmental initiatives and technologies.",
    siteUrl: "https://ecobertura.es",
  },
  {
    title: "Ecobertura App",
    description: "Mobile web application for mapping and tracking eco-friendly activities.",
    siteUrl: "https://ecobertura.net",
  },
  {
    title: "W3 FanSports",
    description: "Social platform for sports fans to connect, share, and compete globally.",
    siteUrl: "https://w3fansports.com",
  },
];

const Projects = () => {
  return (
    <section id="projects" className="text-center fade-in">
      <h2 className="text-4xl md:text-5xl font-bold mb-14 text-indigo-400">
        Projects
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-center">
        {projects.map((project, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl hover:scale-[1.02] transform transition-all duration-300"
          >
            <div className="overflow-hidden rounded-t-3xl">
              <iframe
                src={project.siteUrl}
                title={project.title}
                loading="lazy"
                className="w-full h-[300px] md:h-[350px] rounded-t-3xl border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              ></iframe>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold mb-2 text-indigo-300">{project.title}</h3>
              <p className="text-gray-400 text-sm mb-6">{project.description}</p>
              <a
                href={project.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-indigo-500 text-white font-semibold rounded-full hover:bg-indigo-600 transition"
              >
                Visit Website
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
