import React from 'react';

const fixedInputClass = "rounded-md appearance-none block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 focus:outline-none focus:ring focus:border-blue1 sm:text-sm";

export default function Input({
  handleChange,
  value,
  labelText,
  labelFor,
  id,
  name,
  type,
  isRequired = false,
  placeholder,
  customClasses = '',
  ...props
}) {
  // Ensure value is never undefined to prevent uncontrolled to controlled warnings
  const inputValue = value === undefined ? '' : value;
  
  return (
    <div className="my-5">
      <label htmlFor={labelFor} className="block text-sm font-medium mb-1">
        {labelText}
        {isRequired && <span className="text-red-500">*</span>}
      </label>
      <input
        onChange={handleChange}
        value={inputValue}
        id={id}
        name={name}
        type={type}
        required={isRequired}
        className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 ${customClasses}`}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}
