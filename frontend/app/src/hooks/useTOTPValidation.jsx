import { useState } from "react";
import { useMutationCustom } from "../hooks/apiHooks.jsx";
import { URLS_BACKEND } from "../constants.jsx";

export function useTOTPValidation() {
  const [codeTOTP, setCodeTOTP] = useState("");
  const [errorTOTP, setErrorTOTP] = useState("");
  const [isValidated, setIsValidated] = useState(false); // Nuevo estado

  const mutationTOTP = useMutationCustom(
    URLS_BACKEND.VERIFYTOTP,
    "POST",
    { otp: codeTOTP },
    () => {
      setErrorTOTP("");
      setIsValidated(true); // Marca como validado al éxito
    },
    () => {
      setErrorTOTP("Code not valid");
      setIsValidated(false); // Asegúrate de que el estado no sea validado
    }
  );

  const handleCodeTOTPChange = (e) => {
    const input = e.target.value;
    if (/^\d{0,6}$/.test(input)) {
      // Permitir solo hasta 6 dígitos
      setCodeTOTP(input);
      setErrorTOTP("");
    } else {
      setErrorTOTP("Must contain only digits (max 6).");
    }
  };

  const handleValidateTOTP = () => {
    if (codeTOTP.length === 6) {
      mutationTOTP.mutate();
    } else {
      setErrorTOTP("Code must be 6 digits.");
    }
  };

  const resetValidationState = () => {
    setIsValidated(false);
  };

  return {
    codeTOTP,
    errorTOTP,
    isValidated, // Exponer el nuevo estado
    handleCodeTOTPChange,
    handleValidateTOTP,
    resetValidationState, // Exponer el método de restablecimiento
    mutationTOTP,
  };
}