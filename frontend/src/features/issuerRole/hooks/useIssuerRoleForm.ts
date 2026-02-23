import { useState } from 'react';
import { submitIssuerRoleApplication } from '../api/issuerRoleApi';

export function useIssuerRoleForm() {
  const [institutionName, setInstitutionName] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const errors: { [key: string]: string } = {};
    if (!institutionName.trim()) {
      errors.institutionName = 'Nazwa instytucji jest wymagana.';
    }
    if (!email.trim()) {
      errors.email = 'Email jest wymagany.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      errors.email = 'Nieprawidłowy adres email.';
    }
    if (!description.trim()) {
      errors.description = 'Opis jest wymagany.';
    }
    return errors;
  };

  const handleSubmit = async (values: {
    institutionName: string;
    email: string;
    description: string;
    ethereumAddress: string;
  }) => {
    setError('');
    setSuccess(false);
    const errors: { [key: string]: string } = {};
    if (!values.institutionName.trim()) {
      errors.institutionName = 'Nazwa instytucji jest wymagana.';
    }
    if (!values.email.trim()) {
      errors.email = 'Email jest wymagany.';
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) {
      errors.email = 'Nieprawidłowy adres email.';
    }
    if (!values.description.trim()) {
      errors.description = 'Opis jest wymagany.';
    }
    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    try {
      const result = await submitIssuerRoleApplication(values);
      if (result.success) {
        setSuccess(true);
        setInstitutionName('');
        setEmail('');
        setDescription('');
        setValidationErrors({});
      } else {
        setError(result.message || 'Błąd podczas wysyłania wniosku.');
      }
    } catch (err) {
      setError('Błąd sieci.');
    }
  };

  return {
    institutionName,
    setInstitutionName,
    email,
    setEmail,
    description,
    setDescription,
    success,
    error,
    validationErrors,
    handleSubmit
  };
}