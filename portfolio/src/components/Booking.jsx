import React, { useRef, useState } from 'react';
import { isEmailJsConfigured, sendEmailForm } from '../lib/emailjs';

const Booking = () => {
  const form = useRef();
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const sendEmail = async (e) => {
    e.preventDefault();

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
        message: 'Booking request sent. I will get back to you soon.',
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Something went wrong while sending your request.',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="booking" className="text-center" data-aos="fade-up">
      <h2 className="text-5xl font-extrabold mb-6 text-indigo-400">Book a Meeting</h2>
      <form ref={form} onSubmit={sendEmail} className="max-w-lg mx-auto grid gap-6 text-left">
        <input
          type="text"
          name="user_name"
          placeholder="Full Name"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <input
          type="email"
          name="user_email"
          placeholder="Email Address"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        <textarea
          name="message"
          placeholder="Tell me more..."
          required
          rows="4"
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        ></textarea>
        <input type="hidden" name="subject" value="New booking request from portfolio" />
        <button
          type="submit"
          disabled={isSending || !isEmailJsConfigured}
          className="rounded-xl bg-indigo-500 py-3 font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-indigo-400/50"
        >
          {isSending ? 'Sending...' : 'Submit Booking Request'}
        </button>
      </form>
      {status.message ? (
        <p className={`mt-4 text-sm ${status.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
          {status.message}
        </p>
      ) : null}
      {!isEmailJsConfigured ? (
        <p className="mt-3 text-sm text-slate-400">
          Email delivery is disabled until the EmailJS environment variables are added.
        </p>
      ) : null}
    </section>
  );
};

export default Booking;
