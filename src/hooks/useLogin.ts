import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sendOtpRdx, verifyOtpRdx } from "../slices/LoginSlice";
import type { AppDispatch } from "../store";

const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [phone, setPhone] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openSnackbarState, setOpenSnackbarState] = useState(false);
  const [snackbarState, setSnackbarState] = useState({
    message: "Initial Snackbar Message",
    status: "success",
  });

  const handleLoginSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response: any = await dispatch(sendOtpRdx(phone));
      setSnackbarState({ message: response.message, status: "success" });
      setOpenSnackbarState(true);
      setIsLoading(false);
    } catch (error: any) {
      setSnackbarState({ message: error.message, status: "error" });
      setOpenSnackbarState(true);
      setIsLoading(false);
    }
  };

  return {
    dispatch,
    navigate,
    phone,
    setPhone,
    handleLoginSubmit,
    isLoading,
    openSnackbarState,
    snackbarState,
  };
};

export default useLogin;
