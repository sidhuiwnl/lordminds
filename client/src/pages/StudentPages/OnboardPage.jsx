import React, { useState } from "react";
import { Calendar, Mail, Phone, Lock, User, School, Link, Github, FileText, Upload } from "lucide-react";

export default function StudentRegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "", rollNumber: "", email: "", password: "", dob: "", mobile: "",
    college: "", course: "", year: "", semester: "", github: "", linkedin: "",
    skills: [], resume: null, agreeTerms: false, agreePrivacy: false,
  });

  const [skillInput, setSkillInput] = useState("");

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const addSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!formData.skills.includes(skillInput.trim())) {
        setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const next = () => setCurrentStep(prev => Math.min(3, prev + 1));
  const prev = () => setCurrentStep(prev => Math.max(1, prev - 1));

  const submit = (e) => {
    e.preventDefault();
    console.log("Final Data:", formData);
    alert("Registration Completed Successfully!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C3B6B] to-[#0F4C81] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center text-3xl font-bold text-white">
                LM
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold">Complete Your Profile</h1>
          <p className="text-blue-100 mt-2 text-lg">Please provide the following information to get started</p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-center items-center gap-8 mb-12">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition-all ${
                currentStep >= step ? "bg-yellow-400 text-black" : "bg-gray-600 text-gray-400"
              }`}>
                {step}
              </div>
              <span className={`ml-3 text-lg font-medium ${currentStep >= step ? "text-yellow-400" : "text-gray-500"}`}>
                {step === 1 ? "About You" : step === 2 ? "Academics" : "Credentials"}
              </span>
              {step < 3 && (
                <div className={`w-32 h-1 mx-6 ${currentStep > step ? "bg-yellow-400" : "bg-gray-600"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-10">
          <form onSubmit={submit} className="space-y-10">
            {/* Step 1: About You */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-red-500">*</span>
                  About You
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  <InputField icon={<User />} placeholder="Enter your full name" name="fullName" value={formData.fullName} onChange={handleInput} required />
                  <InputField icon={<User />} placeholder="Enter your roll number" name="rollNumber" value={formData.rollNumber} onChange={handleInput} required />
                  <InputField icon={<Calendar />} type="date" name="dob" value={formData.dob} onChange={handleInput} required />
               
                  <InputField icon={<Mail />} type="email" placeholder="Enter your email" name="email" value={formData.email} onChange={handleInput} required />
                  <InputField icon={<Lock />} type="password" placeholder="Enter your password" name="password" value={formData.password} onChange={handleInput} required />
                  <InputField icon={<Phone />} placeholder="Enter your mobile number" name="mobile" value={formData.mobile} onChange={handleInput} required />
                </div>
              </div>
            )}

            {/* Step 2: Academics */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="text-red-500">*</span>
                  Academic Details
                </h2>
                <div className="grid grid-cols-3 gap-6">
                  <SelectField icon={<School />} name="college" value={formData.college} onChange={handleInput}>
                    <option>Select college</option>
                    <option>KGiSL Institute of Technology</option>
                  </SelectField>
                  <SelectField icon={<School />} name="course" value={formData.course} onChange={handleInput}>
                    <option>Select course</option>
                    <option>B.E. CSE</option>
                    <option>B.Tech IT</option>
                  </SelectField>
                  <SelectField icon={<Calendar />} name="year" value={formData.year} onChange={handleInput}>
                    <option>Select year</option>
                    <option>1st Year</option>
                    <option>2nd Year</option>
                    <option>3rd Year</option>
                    <option>4th Year</option>
                  </SelectField>
                  <SelectField icon={<Calendar />} name="semester" value={formData.semester} onChange={handleInput}>
                    <option>Select semester</option>
                    <option>Semester 1</option>
                    <option>Semester 2</option>
                  </SelectField>
                  <InputField icon={<Github />} placeholder="Enter GitHub URL" name="github" value={formData.github} onChange={handleInput} />
                  <InputField icon={<Link />} placeholder="Enter LinkedIn URL" name="linkedin" value={formData.linkedin} onChange={handleInput} />
                </div>
              </div>
            )}

            {/* Step 3: Credentials */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-800">Credentials</h2>
                <div className="grid grid-cols-2 gap-10">
                  {/* Skills */}
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">Select your Skills</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Type to add your skills..."
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={addSkill}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                      {formData.skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {skill}
                          <button type="button" onClick={() => removeSkill(skill)} className="text-blue-800 hover:text-blue-900">
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Resume Upload */}
                  <div>
                    <label className="block text-lg font-medium text-gray-700 mb-3">Upload Your Resume</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Drag and Drop to upload the file</p>
                      <p className="text-sm text-gray-500 mb-4">PDF, DOC, DOCX, JPG (5MB max)</p>
                      <label className="inline-block px-8 py-3 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition">
                        Browse Files
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg" onChange={(e) => e.target.files?.[0] && setFormData(prev => ({ ...prev, resume: e.target.files[0] }))} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-4 mt-8">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleCheckbox} className="mt-1 w-5 h-5 text-blue-600 rounded" required />
                    <span className="text-gray-700">I agree to the <a href="#" className="text-blue-600 underline">Terms of Services</a> and understand the platform usage guidelines <span className="text-red-500">*</span></span>
                  </label>
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input type="checkbox" name="agreePrivacy" checked={formData.agreePrivacy} onChange={handleCheckbox} className="mt-1 w-5 h-5 text-blue-600 rounded" required />
                    <span className="text-gray-700">I accept the <a href="#" className="text-blue-600 underline">Privacy Policy</a> and consent to data processing <span className="text-red-500">*</span></span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={prev}
                disabled={currentStep === 1}
                className="px-8 py-4 text-gray-600 font-medium disabled:opacity-50"
              >
                ← Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  className="px-10 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-16 py-5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xl font-bold rounded-full shadow-2xl hover:shadow-2xl transform hover:scale-105 transition"
                >
                  Complete Registration
                </button>
              )}
            </div>
          </form>
        </div>

        <p className="text-center text-white mt-6 text-sm">
          <span className="text-red-400">* </span>Required fields
        </p>
      </div>
    </div>
  );
}

// Reusable Input Component
function InputField({ icon, ...props }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        {...props}
      />
    </div>
  );
}

// Reusable Select Component
function SelectField({ icon, children, ...props }) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
        {icon}
      </div>
      <select
        className="w-full pl-12 pr-10 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none bg-white transition"
        {...props}
      >
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}