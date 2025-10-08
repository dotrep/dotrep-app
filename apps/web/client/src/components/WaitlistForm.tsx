import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export default function WaitlistForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      // Reset form after successful submission
      setFormData({ firstName: "", lastName: "", email: "" });
      // Hide success message after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="bg-gray-900/80 text-white p-6 rounded-2xl w-full max-w-md mx-auto backdrop-blur-sm border border-cyan-800/40 shadow-[0_0_35px_rgba(0,240,255,0.15)]">
      <h2 className="text-xl font-bold mb-2 text-cyan-300">Join the FSN Waitlist</h2>
      <p className="text-sm text-cyan-100 mb-4">
        Enter for early access + chance to win from the $100,000 FSN giveaway.
      </p>
      
      {isSuccess ? (
        <div className="bg-green-900/40 border border-green-700 text-green-300 p-3 rounded-lg text-center mb-2">
          Thanks for joining! We'll be in touch soon.
        </div>
      ) : null}
      
      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          className="w-full p-2 rounded bg-gray-800 border border-cyan-900/40 text-cyan-100 placeholder:text-cyan-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          className="w-full p-2 rounded bg-gray-800 border border-cyan-900/40 text-cyan-100 placeholder:text-cyan-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          className="w-full p-2 rounded bg-gray-800 border border-cyan-900/40 text-cyan-100 placeholder:text-cyan-700 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Button
          type="submit"
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl font-bold transition-colors duration-200"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Processing..." : "Join Now"}
        </Button>
      </form>
    </div>
  );
}