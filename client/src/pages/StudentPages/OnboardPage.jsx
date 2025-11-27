import React, { useState, useEffect } from "react";
import { Calendar, Mail, Phone, Link, Github, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function StudentRegistrationForm() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    dob: "",
    mobile: "",
    github: "",
    linkedin: "",
    skills: [],
    resume: null,
    agreeTerms: false,
    agreePrivacy: false,
  });

  // ⭐ Load email from logged-in user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.email) {
      setFormData((prev) => ({ ...prev, email: user.email }));
    }
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const addSkill = (e) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      let skill = skillInput.trim();

      if (!formData.skills.includes(skill)) {
        setFormData((prev) => ({
          ...prev,
          skills: [...prev.skills, skill],
        }));
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const next = () => setCurrentStep((prev) => Math.min(3, prev + 1));
  const prev = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  // ⭐ FINAL SUBMIT HANDLER
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const user_id = user?.user_id;

    if (!user_id) {
      toast.error("User not logged in!");
      setLoading(false);
      return;
    }

    let uploadedResumePath = null;

    // ⭐ STEP 1 — Upload Resume
    if (formData.resume) {
      // Validate file type
      if (!formData.resume.name.toLowerCase().endsWith(".pdf")) {
        toast.error("Only PDF files are allowed!");
        setLoading(false);
        return;
      }

      // Validate file size (5MB max)
      if (formData.resume.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB!");
        setLoading(false);
        return;
      }

      const uploadForm = new FormData();
      uploadForm.append("file", formData.resume);

      const uploadRes = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/student/upload/resume`,
        { method: "POST", body: uploadForm }
      );

      const uploadData = await uploadRes.json();
      uploadedResumePath = uploadData.file_path;
    }

    // ⭐ STEP 2 — Save complete profile
    const payload = {
      user_id,
      email: formData.email,
      dob: formData.dob,
      mobile: formData.mobile,
      github: formData.github,
      linkedin: formData.linkedin,
      resume_path: uploadedResumePath,
      skills: formData.skills,
    };

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL}/student/profile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const result = await res.json();
    setLoading(false);

    if (result.status === "success") {
      toast.success("Profile completed successfully! 🎉");

      user.is_onboarded = true;
      localStorage.setItem("user", JSON.stringify(user));

      setTimeout(() => navigate("/student/studenthome"), 1200);
    } else {
      toast.error("Failed to complete onboarding. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0C3B6B] to-[#0F4C81] flex items-center justify-center px-4 py-12">
      <ToastContainer position="top-center" />

      <div className="w-full max-w-6xl">

        {/* HEADER */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold">Complete Your Profile</h1>
          <p className="text-blue-100 mt-2 text-lg">
            Provide the necessary details to continue
          </p>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex justify-center items-center gap-8 mb-12">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-lg ${
                  currentStep >= step
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-600 text-gray-400"
                }`}
              >
                {step}
              </div>
              <span
                className={`ml-3 text-lg ${
                  currentStep >= step ? "text-yellow-400" : "text-gray-500"
                }`}
              >
                {step === 1
                  ? "Personal"
                  : step === 2
                  ? "Profiles"
                  : "Skills & Resume"}
              </span>
              {step < 3 && (
                <div
                  className={`w-24 sm:w-32 h-1 mx-3 sm:mx-6 ${
                    currentStep > step ? "bg-yellow-400" : "bg-gray-600"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10">
          <form onSubmit={submit} className="space-y-10">

            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                  <InputField
                    icon={<Mail />}
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleInput}
                    required
                  />

                  <InputField
                    icon={<Calendar />}
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInput}
                    required
                  />

                  <InputField
                    icon={<Phone />}
                    name="mobile"
                    placeholder="Enter mobile number"
                    value={formData.mobile}
                    onChange={handleInput}
                    required
                  />
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Profile Links
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputField
                    icon={<Github />}
                    placeholder="GitHub URL"
                    name="github"
                    value={formData.github}
                    onChange={handleInput}
                  />

                  <InputField
                    icon={<Link />}
                    placeholder="LinkedIn URL"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInput}
                  />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-10">

                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Skills & Resume
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                  {/* SKILLS */}
                  <div>
                    <label className="text-lg font-medium text-gray-700 mb-3 block">
                      Add Skills
                    </label>

                    <input
                      className="w-full px-4 py-3 border rounded-xl"
                      placeholder="Type and press Enter..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={addSkill}
                    />

                    <div className="flex flex-wrap gap-3 mt-4">
                      {formData.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full flex items-center"
                        >
                          {skill}
                          <button
                            type="button"
                            className="ml-2 text-blue-700 font-bold"
                            onClick={() => removeSkill(skill)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* RESUME */}
                  <div>
                    <label className="text-lg font-medium text-gray-700 mb-3 block">
                      Upload Resume (PDF only, max 5MB)
                    </label>

                    <div className="border-2 border-dashed p-10 text-center rounded-xl">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                      <label className="px-6 py-3 bg-blue-600 text-white rounded-full cursor-pointer">
                        Upload PDF
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf"
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              resume: e.target.files[0],
                            }))
                          }
                        />
                      </label>

                      {formData.resume && (
                        <p className="mt-4 text-sm text-gray-600">
                          Selected: {formData.resume.name}
                        </p>
                      )}
                    </div>
                  </div>

                </div>

                {/* TERMS */}
                <div className="space-y-4">
                  <label className="flex gap-3">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleCheckbox}
                      required
                    />
                    I agree to the Terms of Service
                  </label>

                  <label className="flex gap-3">
                    <input
                      type="checkbox"
                      name="agreePrivacy"
                      checked={formData.agreePrivacy}
                      onChange={handleCheckbox}
                      required
                    />
                    I accept the Privacy Policy
                  </label>
                </div>
              </div>
            )}

            {/* BUTTONS */}
            <div className="flex justify-between pt-8 border-t">
              <button
                type="button"
                onClick={prev}
                disabled={currentStep === 1}
                className="px-8 py-4 text-gray-600 font-medium disabled:opacity-40"
              >
                ← Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  className="px-10 py-4 bg-yellow-400 text-black rounded-full font-bold hover:bg-yellow-500"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-16 py-5 bg-yellow-400 text-black text-xl font-bold rounded-full hover:bg-yellow-500 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Complete Registration"}
                </button>
              )}
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

function InputField({ icon, ...props }) {
  return (
    <div className="relative">
      <div className="absolute left-0 inset-y-0 pl-4 flex items-center text-gray-400">
        {icon}
      </div>
      <input
        className="w-full pl-12 pr-4 py-4 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
        {...props}
      />
    </div>
  );
}
