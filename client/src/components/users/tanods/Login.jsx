// src/pages/LoginTanod.js
import { useState } from 'react';
import { loginFieldsTanod } from "../../constants/formFields";
import { useNavigate } from 'react-router-dom';
import FormAction from "../../forms/FormAction";
import FormExtra from "../../forms/FormExtra";
import Input from "../../inputs/Input";
import { validateLoginTanod } from '../../../utils/validation';
import { toast, ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { useCombinedContext } from "../../../contexts/useContext"; // Import context
import Loading from "../../../utils/Loading";

const fieldsState = loginFieldsTanod.reduce((acc, field) => {
  acc[field.id] = '';
  return acc;
}, {});

export default function LoginTanod() {
  const [loginState, setLoginState] = useState(fieldsState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useCombinedContext();
  const navigate = useNavigate();

  const handleChange = e => {
    setLoginState({ ...loginState, [e.target.id]: e.target.value });
    setErrors({ ...errors, [e.target.id]: '' });
  };

  const handleSubmit = async e => {
    e.preventDefault();

    const { valid, errors: validationErrors } = validateLoginTanod(loginState);
    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login/tanod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginState),
      });
      const data = await response.json();

      if (response.ok) {
        await login(data.token);
        if (data.userType === 'admin') {
          toast.success('Logged in as Admin!');
          navigate('/admindashboard'); 
        } else if (data.userType === 'tanod') {
          toast.success('Logged in successfully as Tanod!');
          navigate('/dashboard'); 
        } else {
          toast.error('Unauthorized user type');
        }
      } else {
        toast.error(data.message || 'Invalid login credentials');
      }
    } catch (error) {
      console.error('Login Error:', error);
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
          {loginFieldsTanod.map(field => (
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
