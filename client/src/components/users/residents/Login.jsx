// src/pages/LoginResident.js
import { useState } from 'react';
import { loginFieldsResident } from "../../constants/formFields";
import { useNavigate } from 'react-router-dom';
import FormAction from "../../forms/FormAction";
import FormExtra from "../../forms/FormExtra";
import Input from "../../inputs/Input";
import { validateLoginResident } from '../../../utils/validation';
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { useCombinedContext } from "../../../contexts/useContext"; // Import context
import Loading from "../../../utils/Loading";

const fieldsState = loginFieldsResident.reduce((acc, field) => {
  acc[field.id] = '';
  return acc;
}, {});

export default function LoginResident() {
  const [loginState, setLoginState] = useState(fieldsState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useCombinedContext(); // Use login function from context
  const navigate = useNavigate();

  const handleChange = e => {
    setLoginState({ ...loginState, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: '' });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const { valid, errors: validationErrors } = validateLoginResident(loginState);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login/resident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginState),
      });
      const data = await response.json();

      if (response.ok) {
        // Call login from context to set token and fetch user data
        await login(data.token);

        toast.success('Logged in successfully!');
        navigate('/home');
      } else {
        toast.error(data.message || 'Invalid login credentials');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="-space-y-px text-black">
          {loginFieldsResident.map(field => (
            <div key={field.id}>
              <Input
                handleChange={handleChange}
                value={loginState[field.id]}
                {...field}
              />
              {errors[field.id] && <p className="text-red-500">{errors[field.id]}</p>}
            </div>
          ))}
        </div>
        {loading && <Loading type="bar" />}
        <FormExtra />
        <FormAction handleSubmit={handleSubmit} text="Login" />
      </form>
    </>
  );
}
