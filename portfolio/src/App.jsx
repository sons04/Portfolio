import React from 'react';
import Navbar from './components/Navbar';
import AboutExperienceEducation from './components/AboutExperienceEducation';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Booking from './components/Booking';
import Contact from './components/Contact';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100 font-sans">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 pt-24 space-y-32">
        <Projects />
        <AboutExperienceEducation />
        <Skills />
        <Booking />
        <Contact />
      </main>
    </div>
  );
}
