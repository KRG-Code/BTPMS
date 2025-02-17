import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { signupFields } from "../../constants/formFields";
import FormAction from "../../forms/FormAction";
import Input from "../../inputs/Input";
import { validateSignup } from "../../../utils/validation";
import { getPasswordStrength } from "../../../utils/passwordStrength";
import ReCAPTCHA from "react-google-recaptcha";

const fieldsState = signupFields.reduce((acc, field) => {
  acc[field.id] = "";
  return acc;
}, {});

export default function Signup() {
  const navigate = useNavigate();
  const [signupState, setSignupState] = useState(fieldsState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [age, setAge] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    strength: "Weak",
    suggestions: [],
  });
  const [recaptchaToken, setRecaptchaToken] = useState("");

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
    setSignupState((prevState) => ({ ...prevState, [id]: value }));

    if (id === "birthday") {
      setAge(calculateAge(value));
    }

    if (id === "password") {
      const { strength, suggestions } = getPasswordStrength(value);
      setPasswordStrength({ strength, suggestions });
    }

    setErrors((prevErrors) => ({ ...prevErrors, [id]: "" }));
  };

  const handleRecaptcha = (token) => {
    setRecaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { valid, errors: validationErrors } = validateSignup(signupState);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA.");
      return;
    }

    const submissionData = {
      ...signupState,
      age,
      gender:
        signupState.gender === "Not Specified" ? null : signupState.gender,
      userType: "resident",
      recaptchaToken,
    };

    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submissionData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Account created successfully!");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(data.message || "Error occurred during registration");
      }
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <form className="mt-8 space-y-6 text-black" onSubmit={handleSubmit}>
        <div>
          {signupFields.map((field) => (
            <div key={field.id}>
              <Input
                handleChange={handleChange}
                value={signupState[field.id]}
                {...field}
              />
              {errors[field.id] && (
                <p className="text-red-500">{errors[field.id]}</p>
              )}
            </div>
          ))}

          {signupState.password && (
            <div>
              <p
                className={`text-${
                  passwordStrength.strength === "Very Strong"
                    ? "green-500"
                    : "red-500"
                }`}
              >
                Password Strength: {passwordStrength.strength}
              </p>
              <ul className="list-disc ml-4 text-sm text-red-500">
                {passwordStrength.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {signupState.birthday && <p className="text-gray-500">Age: {age}</p>}
          {loading && <p>Loading...</p>}

          <ReCAPTCHA
            sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
            onChange={handleRecaptcha}
          />

          <FormAction handleSubmit={handleSubmit} text="Signup" />
        </div>
      </form>
    </>
  );
}
