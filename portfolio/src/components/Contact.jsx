// src/components/Contact.jsx
import React, { useRef, useState } from 'react';
import { FaLinkedin, FaGithub, FaWhatsapp } from 'react-icons/fa';
import { isEmailJsConfigured, sendEmailForm } from '../lib/emailjs';

const Contact = () => {
  const form = useRef();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isEmailJsConfigured) {
      setStatus({
        type: 'error',
        message: 'Add your EmailJS keys before enabling this form.',
      });
      return;
    }

    try {
      setIsSending(true);
      setStatus({ type: '', message: '' });
      await sendEmailForm(form.current);
      form.current.reset();
      setStatus({
        type: 'success',
        message: 'Your message has been sent successfully.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'The message could not be sent. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="contact" className="mb-20 fade-in">
      <h2 className="text-4xl font-bold mb-8 text-indigo-400">Contact</h2>
      <p className="text-center text-gray-400 mb-8 text-lg">
        I'm currently open to new opportunities and consulting services.
        Feel free to reach out via email or connect through my social platforms.
      </p>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <form
          ref={form}
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-slate-950/50 p-6 shadow-xl shadow-indigo-950/20"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              type="text"
              name="user_name"
              placeholder="Your name"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
            <input
              type="email"
              name="user_email"
              placeholder="Your email"
              required
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            required
            className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
          <textarea
            name="message"
            placeholder="Write your message..."
            required
            rows="6"
            className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          ></textarea>
          <button
            type="submit"
            disabled={isSending || !isEmailJsConfigured}
            className="mt-4 w-full rounded-xl bg-indigo-500 py-3 font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-400/50"
          >
            {isSending ? 'Sending...' : 'Send Message'}
          </button>
          {status.message ? (
            <p className={`mt-4 text-sm ${status.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {status.message}
            </p>
          ) : null}
          {!isEmailJsConfigured ? (
            <p className="mt-3 text-sm text-slate-400">
              Add the EmailJS environment variables to activate the form.
            </p>
          ) : null}
        </form>

        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-6 text-center shadow-xl shadow-indigo-950/20">
          <h3 className="text-2xl font-semibold text-white">Other ways to reach me</h3>
          <p className="mt-3 text-sm text-slate-400">
            You can still connect through my social profiles while the email form handles direct messages.
          </p>
          <div className="mt-8 flex justify-center space-x-8 text-3xl text-indigo-400">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <FaLinkedin className="hover:text-indigo-300" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
              <FaGithub className="hover:text-indigo-300" />
            </a>
            <a href="https://wa.me/yourwhatsapplink" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <FaWhatsapp className="hover:text-indigo-300" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
