// src/components/Contact.jsx
import React from 'react';
import { FaLinkedin, FaGithub, FaWhatsapp } from 'react-icons/fa';

const Contact = () => {
  return (
    <section id="contact" className="text-center mb-20 fade-in">
      <h2 className="text-4xl font-bold mb-8 text-indigo-400">Contact</h2>
      <p className="text-gray-400 mb-8 text-lg">
        I'm currently open to new opportunities and consulting services.
        Feel free to reach out via email or connect through my social platforms.
      </p>

      <div className="flex justify-center space-x-8 text-3xl text-indigo-400">
        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
          <FaLinkedin className="hover:text-indigo-300" />
        </a>
        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
          <FaGithub className="hover:text-indigo-300" />
        </a>
        <a href="https://wa.me/yourwhatsapplink" target="_blank" rel="noopener noreferrer">
          <FaWhatsapp className="hover:text-indigo-300" />
        </a>
      </div>
    </section>
  );
};

export default Contact;
