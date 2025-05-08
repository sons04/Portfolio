import React, { useRef } from 'react';
import emailjs from '@emailjs/browser';

const Booking = () => {
  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    emailjs.sendForm(
      'YOUR_SERVICE_ID',    // Replace
      'YOUR_TEMPLATE_ID',   // Replace
      form.current,
      'YOUR_PUBLIC_KEY'     // Replace
    ).then((result) => {
      alert('Booking Request Sent ✅');
      form.current.reset();
    }, (error) => {
      alert('Something went wrong ❌');
    });
  };

  return (
    <section id="booking" className="text-center" data-aos="fade-up">
      <h2 className="text-5xl font-extrabold mb-6 text-indigo-400">Book a Meeting</h2>
      <form ref={form} onSubmit={sendEmail} className="max-w-lg mx-auto grid gap-6">
        <input type="text" name="name" placeholder="Full Name" required className="input-field" />
        <input type="email" name="email" placeholder="Email Address" required className="input-field" />
        <textarea name="message" placeholder="Tell me more..." required rows="4" className="input-field"></textarea>
        <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 transition py-3 rounded-lg font-semibold text-white">Submit Booking Request</button>
      </form>
    </section>
  );
};

export default Booking;
