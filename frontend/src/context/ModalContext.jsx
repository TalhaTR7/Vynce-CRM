import { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const openModal = (type, payload = {}) => { setModal({ type, payload }) };
  const closeModal = () => setModal(null);

  return (
    <ModalContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    toast.error("no");
    throw new Error("useModal must be used within ModalProvider");
  }
  return context;
};
