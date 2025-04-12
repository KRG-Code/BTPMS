import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Input from "./singupComponents/Input";
import { validateSignup } from "./singupComponents/validation";
import { FaCloudUploadAlt, FaArrowLeft, FaUser, FaPhone, FaEye, FaSun, FaMoon, FaCopy } from "react-icons/fa";
import { uploadProfileImage } from "../../../firebase";
import { motion } from "framer-motion";
import { useTheme } from "../../../contexts/ThemeContext"; // Import the useTheme hook

// --- Define Custom Input Components Outside Signup ---

// Custom Date Input component
const DateInput = React.memo(({ id, labelText, required, value, onChange, isDarkMode, inputLabelClasses, max }) => {
  const formattedValue = value ? value.split('T')[0] : '';
  return (
    <div className="my-5">
      <label htmlFor={id} className={inputLabelClasses}>
        {labelText} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type="date"
        value={formattedValue}
        onChange={onChange}
        required={required}
        max={max}
        className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
          isDarkMode
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-white border-gray-300 text-gray-800'
        }`}
      />
    </div>
  );
});

// Custom Select Input component
const SelectInput = React.memo(({ id, labelText, options, required, value, onChange, isDarkMode, inputLabelClasses }) => (
  <div className="my-5">
    <label htmlFor={id} className={inputLabelClasses}>
      {labelText} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
        isDarkMode
          ? 'bg-gray-700 border-gray-600 text-white' 
          : 'bg-white border-gray-300 text-gray-800'
      }`}
    >
      <option value="">Select {labelText}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
));

// Custom Textarea Input component
const TextareaInput = React.memo(({ id, labelText, required, value, onChange, placeholder, isDarkMode, inputLabelClasses }) => (
  <div className="my-5">
    <label htmlFor={id} className={inputLabelClasses}>
      {labelText} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={`w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${
        isDarkMode
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
          : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
      }`}
      rows="3"
    />
  </div>
));

// Themed Input component (wrapper around base Input)
const ThemedInput = React.memo((props) => {
  const { isDarkMode, ...rest } = props;
  return (
    <Input
      {...rest}
      customClasses={`${
        isDarkMode 
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
          : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
      }`}
    />
  );
});

// --- End of Custom Input Components ---

// Define all required fields for the signup form (removing password fields)
const signupFields = [
  {
    id: "firstName",
    labelText: "First Name",
    labelFor: "firstName",
    name: "firstName",
    type: "text",
    placeholder: "First Name",
    required: true,
  },
  {
    id: "middleName",
    labelText: "Middle Name",
    labelFor: "middleName",
    name: "middleName",
    type: "text",
    placeholder: "Middle Name",
  },
  {
    id: "lastName",
    labelText: "Last Name",
    labelFor: "lastName",
    name: "lastName",
    type: "text",
    placeholder: "Last Name",
    required: true,
  },
  {
    id: "birthday",
    labelText: "Date of Birth",
    labelFor: "birthday",
    name: "birthday",
    type: "date",
    required: true,
  },
  {
    id: "gender",
    labelText: "Gender",
    labelFor: "gender",
    name: "gender",
    type: "select",
    options: ["Male", "Female", "Others", "Prefer not to say"],
    required: true,
  },
  {
    id: "maritalStatus",
    labelText: "Marital Status",
    labelFor: "maritalStatus",
    name: "maritalStatus",
    type: "select",
    options: ["Single", "Married", "Divorced", "Widowed", "Separated"],
    required: true,
  },
  {
    id: "citizenship",
    labelText: "Citizenship",
    labelFor: "citizenship",
    name: "citizenship",
    type: "text",
    placeholder: "Citizenship",
    required: true,
  },
  {
    id: "religion",
    labelText: "Religion",
    labelFor: "religion",
    name: "religion",
    type: "text",
    placeholder: "Religion",
  },
  {
    id: "address",
    labelText: "Address",
    labelFor: "address",
    name: "address",
    type: "textarea",
    placeholder: "Complete Address",
    required: true,
  },
  {
    id: "contactNumber",
    labelText: "Telephone/Mobile Number",
    labelFor: "contactNumber",
    name: "contactNumber",
    type: "tel",
    placeholder: "Telephone/Mobile Number",
    required: true,
  },
  {
    id: "email",
    labelText: "Email",
    labelFor: "email",
    name: "email",
    type: "email",
    placeholder: "Email",
    required: true,
  },
];

// Create initial form state from fields
const fieldsState = signupFields.reduce((acc, field) => {
  acc[field.id] = "";
  return acc;
}, {});

// Animation variants
const pageVariants = {
  initial: { opacity: 0 },
  in: { 
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  out: { 
    opacity: 0,
    transition: { duration: 0.5, ease: "easeIn" }
  }
};

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export default function Signup() {
  const navigate = useNavigate();
  const { isDarkMode, theme, toggleTheme } = useTheme(); // Use the theme context
  const [signupState, setSignupState] = useState(fieldsState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [age, setAge] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [generatedPin, setGeneratedPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [generatedResidentId, setGeneratedResidentId] = useState("");
  const [profileImageError, setProfileImageError] = useState("");
  const [previewResidentId, setPreviewResidentId] = useState("BSA123456"); // Example ID for preview
  const [profileRequiredError, setProfileRequiredError] = useState("");
  
  // State for profile picture
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Function to generate PIN based on user's information
  const generatePin = () => {
    if (!signupState.firstName || !signupState.lastName || !signupState.birthday) {
      return "";
    }

    const firstInitial = signupState.firstName.charAt(0).toUpperCase();
    const middleInitial = signupState.middleName ? signupState.middleName.charAt(0).toUpperCase() : "";
    const lastInitial = signupState.lastName.charAt(0).toUpperCase();
    
    // Extract birth date components
    const birthDate = new Date(signupState.birthday);
    const day = String(birthDate.getDate()).padStart(2, '0');
    const month = String(birthDate.getMonth() + 1).padStart(2, '0');
    const year = String(birthDate.getFullYear()).slice(-2);
    
    // Use only @ as the special character
    const specialChar = '@';
    
    // Combine to form PIN
    return `${firstInitial}${middleInitial}${lastInitial}${specialChar}${day}${month}${year}`;
  };

  // Generate PIN whenever relevant fields change
  useEffect(() => {
    const pin = generatePin();
    setGeneratedPin(pin);
    
    // Set the generated PIN as the password
    setSignupState(prevState => ({
      ...prevState,
      password: pin,
      confirmPassword: pin
    }));
  }, [signupState.firstName, signupState.middleName, signupState.lastName, signupState.birthday]);

  const calculateAge = (birthday) => {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    
    // Update state in a more stable way
    setSignupState(prev => {
      const newState = { ...prev, [id]: value };
      
      // Special handling for birthday field
      if (id === "birthday") {
        const calculatedAge = calculateAge(value);
        setAge(calculatedAge);
        newState.age = calculatedAge;
      }
      
      return newState;
    });

    // Clear any errors for this field
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset errors
    setProfileImageError("");
    setProfileRequiredError("");

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileImageError('Image size should be less than 5MB');
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Check file type more thoroughly
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setProfileImageError('Please select a valid image file (JPEG, PNG, GIF)');
      toast.error('Please select a valid image file (JPEG, PNG, GIF)');
      return;
    }

    try {
      // Create a local preview of the selected image
      const previewURL = URL.createObjectURL(file);
      setImagePreview(previewURL);
      setProfileImageFile(file);
    } catch (error) {
      console.error('Error preparing image:', error);
      setProfileImageError('Failed to prepare image preview');
      toast.error('Failed to prepare image preview');
    }
  };

  // Copy PIN to clipboard
  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(generatedPin);
    toast.info("PIN copied to clipboard!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submission started");
  
    const { valid, errors: validationErrors } = validateSignup(signupState);
    if (!valid) {
      console.log("Validation failed:", validationErrors);
      setErrors(validationErrors);
      return;
    }
  
    // Ensure profile picture is uploaded
    if (!profileImageFile) {
      console.log("Profile picture missing");
      setProfileRequiredError("Profile picture is required");
      toast.error("Please upload a profile picture");
      return;
    }
  
    // Display loading toast
    const loadingToastId = toast.loading("Creating your account...");
    setLoading(true);
  
    try {
      console.log("Uploading profile picture...");
      // First upload profile image if one was selected
      let profilePictureUrl = null;
      if (profileImageFile) {
        try {
          // Generate a temporary ID for the file path
          const tempId = Date.now().toString();
          profilePictureUrl = await uploadProfileImage(profileImageFile, `resident_${tempId}`);
          console.log("Profile picture uploaded:", profilePictureUrl);
        } catch (uploadError) {
          console.error("Profile upload error:", uploadError);
          toast.dismiss(loadingToastId);
          toast.error("Failed to upload profile image. Please try again.");
          setLoading(false);
          return;
        }
      }
  
      const submissionData = {
        ...signupState,
        age,
        gender: signupState.gender === "Prefer not to say" ? null : signupState.gender,
        userType: "resident",
        profilePicture: profilePictureUrl,
      };
      
      console.log("Submission data ready:", submissionData);
      console.log("Sending to:", `${process.env.REACT_APP_API_URL}/residents/register`);
      
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/residents/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
          credentials: 'include'
        }
      );
      
      console.log("Response received. Status:", response.status);
      
      let data;
      try {
        data = await response.json();
        console.log("Response data:", data);
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        toast.dismiss(loadingToastId);
        toast.error("Server response was malformed. Please try again later.");
        setLoading(false);
        return;
      }
      
      // Dismiss loading toast
      toast.dismiss(loadingToastId);
      
      if (response.ok) {
        console.log("Registration successful!");
        toast.success("Account created successfully!");
        
        // Save the resident ID from the response
        if (data.resident && data.resident.residentId) {
          console.log("Setting resident ID:", data.resident.residentId);
          setGeneratedResidentId(data.resident.residentId);
        }
        
        // Show success modal with PIN and resident ID
        setShowPin(true);
        
      } else {
        console.error("Registration failed:", data);
        toast.error(data.message || "Error occurred during registration");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.dismiss(loadingToastId);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Next step handler - prevent form submission when moving to step 3
  const handleNextStep = (e) => {
    // Add preventDefault to ensure no form submission happens
    if (e) e.preventDefault();
    
    let canProceed = true;
    const newErrors = {};

    // Validate fields based on current step
    if (currentStep === 1) {
      // Check if profile picture is uploaded - MANDATORY
      if (!profileImageFile) {
        setProfileRequiredError("Profile picture is required to proceed");
        toast.error("Please upload a profile picture");
        canProceed = false;
      }
      
      // Personal info validation
      const requiredFields = ["firstName", "lastName", "birthday", "gender", "maritalStatus", "citizenship"];
      requiredFields.forEach(field => {
        if (!signupState[field]?.trim()) {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
          canProceed = false;
        }
      });
    } else if (currentStep === 2) {
      // Contact info validation
      const requiredFields = ["contactNumber", "email", "address"];
      requiredFields.forEach(field => {
        if (!signupState[field]?.trim()) {
          newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
          canProceed = false;
        }
      });
      
      // Email format validation
      if (signupState.email && !/\S+@\S+\.\S+/.test(signupState.email)) {
        newErrors.email = "Please enter a valid email address";
        canProceed = false;
      }
      
      // Phone format validation
      if (signupState.contactNumber && !/^\+?[0-9]{10,15}$/.test(signupState.contactNumber.replace(/\s+/g, ''))) {
        newErrors.contactNumber = "Please enter a valid phone number";
        canProceed = false;
      }
    }

    if (canProceed) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      setErrors(newErrors);
    }
  };

  // Previous step handler
  const handlePreviousStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
    window.scrollTo(0, 0);
  };

  // Define theme-aware styling classes
  const pageClasses = isDarkMode 
    ? "min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 py-12 px-4 sm:px-6 text-gray-200" 
    : "min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6";

  const cardClasses = isDarkMode
    ? "bg-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-700"
    : "bg-white rounded-xl overflow-hidden shadow-2xl";

  const headerClasses = isDarkMode
    ? "bg-gradient-to-r from-indigo-900 to-purple-900 px-6 py-8 text-white"
    : "bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white";

  const stepIndicatorActiveClasses = isDarkMode
    ? "bg-blue-500 text-white"
    : "bg-blue-600 text-white";

  const stepIndicatorCompletedClasses = isDarkMode
    ? "bg-green-400 text-white"
    : "bg-green-500 text-white";

  const stepIndicatorInactiveClasses = isDarkMode
    ? "bg-gray-600 text-gray-300"
    : "bg-gray-300 text-gray-600";

  const inputLabelClasses = isDarkMode
    ? "block text-gray-200 font-semibold mb-1"
    : "block text-gray-800 font-semibold mb-1";

  const errorTextClasses = isDarkMode
    ? "text-red-400 text-sm mt-1"
    : "text-red-500 text-sm mt-1";

  const linkClasses = isDarkMode
    ? "flex items-center text-blue-400 hover:text-blue-300 transition-colors"
    : "flex items-center text-blue-600 hover:text-blue-800 transition-colors";

  const primaryButtonClasses = isDarkMode
    ? "px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
    : "px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium";

  const secondaryButtonClasses = isDarkMode
    ? "px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center"
    : "px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center";

  const successButtonClasses = isDarkMode
    ? "px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
    : "px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium";

  const disabledButtonClasses = isDarkMode
    ? "px-6 py-2.5 bg-gray-700 text-gray-500 rounded-lg cursor-not-allowed font-medium"
    : "px-6 py-2.5 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed font-medium";

  const uploadButtonClasses = isDarkMode
    ? "bg-gray-700 text-blue-400 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center font-medium"
    : "bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center font-medium";

  // Step indicator component with theme support
  const StepIndicator = ({ currentStep, totalSteps }) => {
    return (
      <div className="flex items-center justify-center mb-8">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div key={index} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full 
                ${currentStep > index + 1
                  ? stepIndicatorCompletedClasses
                  : currentStep === index + 1
                  ? stepIndicatorActiveClasses
                  : stepIndicatorInactiveClasses
                } font-bold text-lg transition-all duration-300`}>
              {index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div className={`w-12 h-1 mx-1 
                ${currentStep > index + 1 
                  ? (isDarkMode ? "bg-green-400" : "bg-green-500")
                  : (isDarkMode ? "bg-gray-600" : "bg-gray-300")
                } transition-all duration-300`}>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Get fields for current step
  const getFieldsForStep = (step) => {
    const stepToFieldsMap = {
      1: ["firstName", "middleName", "lastName", "birthday", "gender", "maritalStatus", "citizenship", "religion"],
      2: ["contactNumber", "email", "address"],
      3: [] // Step 3 has no input fields, it's a review step
    };
    // Ensure step exists in the map, return empty array if not
    const fieldIdsForStep = stepToFieldsMap[step] || []; 
    const filteredFields = signupFields.filter(field => fieldIdsForStep.includes(field.id));
    return filteredFields;
  };

  // Get step title
  const getStepTitle = (step) => {
    switch(step) {
      case 1:
        return "Personal Information";
      case 2:
        return "Contact Details";
      case 3:
        return "Review Information"; // Updated title for Step 3
      default:
        return "Registration";
    }
  };

  // Get icon for step
  const getStepIcon = (step) => {
    switch(step) {
      case 1:
        return <FaUser className="mr-2" />;
      case 2:
        return <FaPhone className="mr-2" />;
      case 3:
        return <FaEye className="mr-2" />; // Updated icon for Step 3
      default:
        return null;
    }
  };

  // Get fields for rendering
  const fieldsForRender = getFieldsForStep(currentStep);

  // Helper to get label text for summary
  const getLabelTextById = (id) => {
    const field = signupFields.find(f => f.id === id);
    return field ? field.labelText : id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // Fallback formatting
  };

  // Copy to clipboard function for both ID and PIN
  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    toast.info(`${type} copied to clipboard!`);
  };

  return (
    <motion.div
      className={pageClasses}
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
    >
      <ToastContainer 
        position="top-right" 
        theme={isDarkMode ? "dark" : "light"}
      />
      <div className="max-w-3xl mx-auto">
        {/* Theme toggle and Back to home link */}
        <div className="flex justify-between items-center mb-6">
          <Link 
            to="/"
            className={linkClasses}
          >
            <FaArrowLeft className="mr-2" /> Back to Home
          </Link>
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            } transition-colors`}
            aria-label="Toggle theme"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <FaSun size={20} /> : <FaMoon size={20} />}
          </button>
        </div>
        
        <motion.div
          className={cardClasses}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <div className={headerClasses}>
            <motion.h1 variants={itemVariants} className="text-3xl font-bold text-center">
              Resident Registration
            </motion.h1>
            <motion.p variants={itemVariants} className="text-blue-100 text-center mt-2">
              Join our community today
            </motion.p>
          </div>

          <div className={`p-6 ${isDarkMode ? 'text-gray-200' : ''}`}>
            <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
            <motion.h2 
              className={`text-xl font-bold mb-6 flex items-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}
              key={currentStep}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {getStepIcon(currentStep)} {getStepTitle(currentStep)}
            </motion.h2>
            
            <form onSubmit={handleSubmit} id="residentSignupForm">
              {/* Profile Picture Section - Only show in step 1 */}
              {currentStep === 1 && (
                <motion.div 
                  className="flex flex-col items-center mb-6"
                  variants={itemVariants}
                >
                  <div className={`w-36 h-36 rounded-full overflow-hidden border-4 ${
                    profileRequiredError 
                      ? 'border-red-500 animate-pulse' 
                      : isDarkMode ? 'border-gray-700' : 'border-blue-100'
                  } shadow-lg mb-3 flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} relative group`}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <FaUser size={40} />
                        <p className="text-xs mt-2">Profile Photo</p>
                        {profileRequiredError && (
                          <p className="text-xs text-red-500 mt-1 font-bold">Required</p>
                        )}
                      </div>
                    )}
                    <div 
                      className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <div className="text-white text-center">
                        <FaCloudUploadAlt size={30} className="mx-auto" />
                        <p className="text-xs mt-1">Change Photo</p>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className={uploadButtonClasses}
                  >
                    <FaCloudUploadAlt className="mr-2" /> {profileImageFile ? "Change" : "Upload"} Profile Photo<span className="text-red-500">*</span>
                  </button>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  {profileImageFile && (
                    <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Selected: {profileImageFile.name}
                    </p>
                  )}
                  {profileRequiredError && (
                    <p className={`text-sm mt-2 ${errorTextClasses} font-semibold`}>
                      {profileRequiredError}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Conditional Rendering: Inputs for Steps 1 & 2, Summary for Step 3 */}
              {currentStep < 3 ? (
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6"
                  initial="hidden" 
                  animate="visible" 
                  variants={containerVariants} 
                >
                  {/* Render input fields for steps 1 and 2 */}
                  {fieldsForRender.map((field) => {
                    const fieldKey = `${field.id}-${currentStep}`;
                    
                    if (field.type === "select") {
                      return (
                        <motion.div key={fieldKey} variants={itemVariants}> {/* Apply itemVariants */}
                          <SelectInput
                            id={field.id}
                            labelText={field.labelText}
                            options={field.options}
                            required={field.required}
                            value={signupState[field.id] || ''}
                            onChange={handleChange}
                            isDarkMode={isDarkMode} // Pass theme prop
                            inputLabelClasses={inputLabelClasses} // Pass classes prop
                          />
                          {errors[field.id] && (
                            <p className={errorTextClasses}>{errors[field.id]}</p>
                          )}
                        </motion.div>
                      );
                    } else if (field.type === "textarea") {
                      return (
                        <motion.div key={fieldKey} className="md:col-span-2" variants={itemVariants}> {/* Apply itemVariants */}
                          <TextareaInput
                            id={field.id}
                            labelText={field.labelText}
                            required={field.required}
                            value={signupState[field.id] || ''}
                            onChange={handleChange}
                            placeholder={field.placeholder}
                            isDarkMode={isDarkMode} // Pass theme prop
                            inputLabelClasses={inputLabelClasses} // Pass classes prop
                          />
                          {errors[field.id] && (
                            <p className={errorTextClasses}>{errors[field.id]}</p>
                          )}
                        </motion.div>
                      );
                    } else if (field.type === "date") {
                      return (
                        <motion.div key={fieldKey} variants={itemVariants}> {/* Apply itemVariants */}
                          <DateInput
                            id={field.id}
                            labelText={field.labelText}
                            required={field.required}
                            value={signupState[field.id] || ''}
                            onChange={handleChange}
                            isDarkMode={isDarkMode} // Pass theme prop
                            inputLabelClasses={inputLabelClasses} // Pass classes prop
                            max={new Date().toISOString().split('T')[0]} // Pass max date
                          />
                          {errors[field.id] && (
                            <p className={errorTextClasses}>{errors[field.id]}</p>
                          )}
                        </motion.div>
                      );
                    } else {
                      return (
                        <motion.div key={fieldKey} variants={itemVariants}> {/* Apply itemVariants */}
                          <ThemedInput
                            handleChange={handleChange}
                            value={signupState[field.id] || ''}
                            isDarkMode={isDarkMode} // Pass theme prop
                            // Pass all other field props directly
                            id={field.id}
                            labelText={field.labelText}
                            labelFor={field.labelFor}
                            name={field.name}
                            type={field.type}
                            isRequired={field.required}
                            placeholder={field.placeholder}
                          />
                          {errors[field.id] && (
                            <p className={errorTextClasses}>{errors[field.id]}</p>
                          )}
                        </motion.div>
                      );
                    }
                  })}
                  
                  {/* Display age when birthdate is entered (only in step 1) */}
                  {currentStep === 1 && signupState.birthday && age !== null && (
                    <motion.p 
                      variants={itemVariants}
                      className={`font-medium mt-1 mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                    >
                      Age: {age} years old
                    </motion.p>
                  )}
                </motion.div>
              ) : (
                // --- Review Step (Step 3) ---
                <motion.div 
                  className="space-y-4"
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                >
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Please review your information carefully before submitting.
                  </p>
                  
                  {/* Display Profile Picture Preview */}
                   {imagePreview ? (
                     <motion.div variants={itemVariants} className="mb-4 flex flex-col items-center">
                       <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>Profile Picture</h4>
                       <img src={imagePreview} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-2 border-gray-300" />
                       {profileImageError && (
                         <p className="text-red-500 text-sm mt-2">{profileImageError}</p>
                       )}
                     </motion.div>
                   ) : (
                     <motion.div variants={itemVariants} className="mb-4 flex flex-col items-center">
                       <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                         No profile picture selected. You can continue without one or go back to add it.
                       </p>
                     </motion.div>
                   )}

                  {/* Display Resident ID Preview */}
                  <motion.div variants={itemVariants} className="mb-4">
                    <h4 className={`font-semibold mb-2 border-b pb-1 ${isDarkMode ? 'border-gray-600 text-blue-300' : 'border-gray-300 text-blue-600'}`}>
                      Resident ID
                    </h4>
                    <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                      <p className={`mb-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Your unique resident ID will be generated upon registration. Example:
                      </p>
                      <p className={`font-mono font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {previewResidentId}
                      </p>
                    </div>
                  </motion.div>

                  {/* Display Personal Information */}
                  <motion.div variants={itemVariants}>
                    <h4 className={`font-semibold mb-2 border-b pb-1 ${isDarkMode ? 'border-gray-600 text-blue-300' : 'border-gray-300 text-blue-600'}`}>Personal Information</h4>
                    {getFieldsForStep(1).map(field => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 mb-1 text-sm">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getLabelTextById(field.id)}:</span>
                        <span className="col-span-2">{signupState[field.id] || 'N/A'}</span>
                      </div>
                    ))}
                     {/* Display Age */}
                     {age !== null && (
                       <div className="grid grid-cols-3 gap-2 mb-1 text-sm">
                         <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age:</span>
                         <span className="col-span-2">{age} years old</span>
                       </div>
                     )}
                  </motion.div>

                  {/* Display Contact Details */}
                  <motion.div variants={itemVariants}>
                    <h4 className={`font-semibold mb-2 mt-4 border-b pb-1 ${isDarkMode ? 'border-gray-600 text-blue-300' : 'border-gray-300 text-blue-600'}`}>Contact Details</h4>
                    {getFieldsForStep(2).map(field => (
                      <div key={field.id} className="grid grid-cols-3 gap-2 mb-1 text-sm">
                        <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{getLabelTextById(field.id)}:</span>
                        <span className={`col-span-2 ${field.id === 'address' ? 'whitespace-pre-wrap' : ''}`}>{signupState[field.id] || 'N/A'}</span>
                      </div>
                    ))}
                  </motion.div>

                  {/* Display generated PIN */}
                  {generatedPin && (
                    <motion.div 
                      className={`md:col-span-2 p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-blue-50 border-blue-100'
                      } my-4`}
                      variants={itemVariants}
                    >
                      <h3 className={`text-lg font-semibold mb-2 ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        Your Generated PIN (Password)
                      </h3>
                      <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Please save this PIN. You will need it to log in.
                      </p>
                      <div className={`flex items-center p-3 rounded ${
                        isDarkMode ? 'bg-gray-800' : 'bg-white'
                      } border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                        <span className={`font-mono text-xl font-bold flex-grow ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          {generatedPin}
                        </span>
                        <button
                          type="button"
                          onClick={copyPinToClipboard}
                          className={`ml-2 p-2 rounded ${
                            isDarkMode
                              ? 'bg-gray-700 hover:bg-gray-600 text-blue-300' 
                              : 'bg-gray-100 hover:bg-gray-200 text-blue-600'
                          }`}
                          title="Copy PIN to clipboard"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
                // --- End of Review Step ---
              )} 
              
              {/* Navigation buttons */}
              <motion.div
                className="mt-8 flex justify-between items-center"
                variants={itemVariants}
              >
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className={secondaryButtonClasses}
                  >
                    <FaArrowLeft className="mr-2" /> Previous
                  </button>
                ) : (
                  <div></div> // Empty div to maintain spacing
                )}
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep} // This should be type="button" not "submit"
                    className={primaryButtonClasses}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="residentSignupForm"
                    disabled={loading || !!profileImageError}
                    className={loading || !!profileImageError ? disabledButtonClasses : successButtonClasses}
                  >
                    {loading ? "Processing..." : "Complete Registration"}
                  </button>
                )}
              </motion.div>
              
              {/* Login link */}
              <motion.p 
                className={`text-center mt-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                variants={itemVariants}
              >
                Already have an account?{" "}
                <Link to="/tanod-login" className={isDarkMode ? "text-blue-400 hover:underline" : "text-blue-600 hover:underline"}>
                  Log in
                </Link>
              </motion.p>
            </form>
          </div>
        </motion.div>
      </div>
      
      {/* PIN Success Modal */}
      {showPin && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`max-w-md w-full p-6 rounded-lg shadow-2xl ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-green-900' : 'bg-green-100'
              }`}>
                <svg className={`w-12 h-12 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className={`text-2xl font-bold mt-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                Registration Successful!
              </h2>
            </div>
            
            {/* Resident ID Section */}
            {generatedResidentId && (
              <div className={`p-4 rounded-lg mb-4 text-center ${
                isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-blue-50'
              }`}>
                <h3 className={`text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Your Resident ID
                </h3>
                <p className={`font-mono text-2xl font-bold ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {generatedResidentId}
                </p>
              </div>
            )}
            
            {/* PIN Section */}
            <p className={`mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Your account has been created successfully. Here's your PIN for logging in:
            </p>
            <div className={`p-4 rounded-lg mb-6 text-center ${
              isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-blue-50'
            }`}>
              <p className={`font-mono text-2xl font-bold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                {generatedPin}
              </p>
            </div>
            
            <div className={`p-3 rounded-lg mb-6 ${
              isDarkMode ? 'bg-yellow-900 bg-opacity-40 text-yellow-200' : 'bg-yellow-50 text-yellow-800'
            }`}>
              <p className="flex items-start">
                <span className="mr-2 mt-1">⚠️</span>
                <span>Please save both your Resident ID and PIN somewhere safe. You'll need them to access your account.</span>
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-between">
              {/* Button to copy Resident ID */}
              <button
                onClick={() => copyToClipboard(generatedResidentId, "Resident ID")}
                className={`px-4 py-2 rounded flex items-center ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                <FaCopy className="mr-2" /> Copy ID
              </button>
              
              {/* Button to copy PIN */}
              <button
                onClick={() => copyToClipboard(generatedPin, "PIN")}
                className={`px-4 py-2 rounded flex items-center ${
                  isDarkMode 
                    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                <FaCopy className="mr-2" /> Copy PIN
              </button>
              
              {/* Button to go to home - modify this button to navigate without timeout */}
              <button
                onClick={() => {
                  setShowPin(false); // Close modal first
                  navigate("/"); // Then navigate to home
                }}
                className={`px-4 py-2 rounded ${
                  isDarkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Go to Home
              </button>
            </div>
            
            <p className={`text-center text-sm mt-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Your registration is complete. Click "Go to Home" when you're ready.
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
