import React, { useState, useEffect } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [nav, setNav] = useState(false);
  const [showNav, setShowNav] = useState(true);
  let lastScrollY = window.scrollY;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowNav(false); // scroll down → hide nav
      } else {
        setShowNav(true);  // scroll up → show nav
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const links = [
    { id: 1, link: 'about' },
    { id: 2, link: 'experience' },
    { id: 3, link: 'education' },
    { id: 4, link: 'skills' },
    { id: 5, link: 'projects' },
    { id: 6, link: 'booking' },
    { id: 7, link: 'contact' },
  ];

  return (
    <div className={`fixed w-full h-20 flex justify-between items-center px-4 bg-gray-900 text-gray-100 transition-all duration-300 z-50 ${showNav ? 'top-0' : '-top-24'}`}>
      <h1 className="text-2xl font-bold text-indigo-400">MyPortfolio</h1>

      {/* Desktop Menu */}
      <ul className="hidden md:flex space-x-6">
        {links.map(({ id, link }) => (
          <li key={id} className="capitalize cursor-pointer hover:text-indigo-400 transition">
            <a href={`#${link}`}>{link}</a>
          </li>
        ))}
      </ul>

      {/* Hamburger Icon */}
      <div onClick={() => setNav(!nav)} className="cursor-pointer z-50 md:hidden text-gray-300">
        {nav ? <FaTimes size={30} /> : <FaBars size={30} />}
      </div>

      {/* Mobile Menu */}
      {nav && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center space-y-8 z-40 transition-all duration-500">
          {links.map(({ id, link }) => (
            <a
              key={id}
              href={`#${link}`}
              onClick={() => setNav(false)}
              className="text-3xl capitalize text-white hover:text-indigo-400 transition"
            >
              {link}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
