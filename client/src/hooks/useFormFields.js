import { useState } from 'react';

export const useFormFields = (initialState) => {
  const [formState, setFormState] = useState(initialState);
  
  const handleChange = ({ target: { id, value } }) => {
    setFormState(prev => ({ ...prev, [id]: value }));
  };

  return [formState, handleChange];
};
