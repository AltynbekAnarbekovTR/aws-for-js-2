// ErrorContext.tsx
import React from "react";

const ErrorContext = React.createContext({
  onError: (error: Error) => {},
});

export const ErrorProvider = ({ children }: { children: any }) => {
  const handleError = (error: Error) => {
    console.error("Handled by ErrorContext:", error);
    alert(error.message);
  };

  return (
    <ErrorContext.Provider value={{ onError: handleError }}>
      {children}
    </ErrorContext.Provider>
  );
};

export const useError = () => React.useContext(ErrorContext);
