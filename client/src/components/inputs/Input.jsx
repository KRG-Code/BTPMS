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
}) {
  return (
    <div className="my-5">
      <label htmlFor={labelFor} className="sr-only">
        {labelText}
      </label>
      <input
        onChange={handleChange}
        value={value}
        id={id}
        name={name}
        type={type}
        required={isRequired}
        className={fixedInputClass}
        placeholder={placeholder}
      />
    </div>
  );
}
