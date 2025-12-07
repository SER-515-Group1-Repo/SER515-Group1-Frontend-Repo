import { useState, useEffect } from "react";
import { UserCircle2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import apiClient from "@/api/axios";
import { toastNotify } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

import { emailRegex, nameRegex, userNameRegex } from "@/lib/constants";

const initialState = {
  name: "",
  email: "",
  userName: "",
  password: "",
};

const LoginPage = ({ type }) => {
  const { login } = useAuth();

  const [userData, setUserData] = useState({
    ...initialState,
    email: localStorage.getItem("userEmail") || "",
  });
  const [rePassword, setRePassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    localStorage.getItem("rememberMe") === "true" || false
  );
  const [errorState, setErrorState] = useState(initialState);

  // Real-time validation as user types
  useEffect(() => {
    const errors = { ...initialState, rePassword: "" };
    if (!userData?.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(userData.email)) {
      errors.email = "Enter a valid email address";
    }
    if (!userData?.password) {
      errors.password = "Password is required";
    } else if (userData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }
    if (type === "sign-up") {
      if (!userData?.name) {
        errors.name = "Name is required";
      } else if (!nameRegex.test(userData.name)) {
        errors.name = "Name should contain only letters and spaces";
      }
      if (!userData?.userName) {
        errors.userName = "User name is required";
      } else if (!userNameRegex.test(userData.userName)) {
        errors.userName = "User name must be alphanumeric (no spaces)";
      }
      if (!rePassword) {
        errors.rePassword = "Please re-enter your password";
      } else if (userData.password !== rePassword) {
        errors.rePassword = "Passwords do not match";
      }
    }
    setErrorState(errors);
  }, [userData, rePassword, type]);

  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForgotPasswordOpen = () => {
    setShowForgotPassword(true);
    setForgotPasswordStep(1);
    setForgotEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotPasswordError("");
  };

  const handleForgotPasswordClose = () => {
    setShowForgotPassword(false);
    setForgotPasswordStep(1);
    setForgotEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotPasswordError("");
  };

  const handleVerifyEmail = async () => {
    if (!forgotEmail) {
      setForgotPasswordError("Email is required");
      return;
    }
    if (!emailRegex.test(forgotEmail)) {
      setForgotPasswordError("Enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`${import.meta.env.VITE_BASE_URL}/forgot-password`, {
        email: forgotEmail,
      });
      setForgotPasswordError("");
      setForgotPasswordStep(2);
    } catch (error) {
      const statusCode = error?.response?.status;
      if (statusCode === 404) {
        setForgotPasswordError("No account found with this email");
      } else {
        setForgotPasswordError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setForgotPasswordError("New password is required");
      return;
    }
    if (newPassword.length < 8) {
      setForgotPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotPasswordError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`${import.meta.env.VITE_BASE_URL}/reset-password`, {
        email: forgotEmail,
        new_password: newPassword,
      });
      toastNotify("Password reset successfully! Please log in.", "success");
      handleForgotPasswordClose();
    } catch (error) {
      setForgotPasswordError("Failed to reset password. Please try again.");
      console.error("Error resetting password:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRememberMe = (checked) => {
    if (checked) {
      setRememberMe(true);
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("userEmail", userData?.email);
    } else {
      setRememberMe(false);
      localStorage.removeItem("userEmail");
      localStorage.removeItem("rememberMe");
    }
  };

  const checkValidation = () => {
    const errors = {
      name: "",
      email: "",
      userName: "",
      password: "",
      rePassword: "",
    };

    if (!userData?.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(userData.email)) {
      errors.email = "Enter a valid email address";
    }

    if (!userData?.password) {
      errors.password = "Password is required";
    } else if (userData.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (type === "sign-up") {
      if (!userData?.name) {
        errors.name = "Name is required";
      } else if (!nameRegex.test(userData.name)) {
        errors.name = "Name should contain only letters and spaces";
      }

      if (!userData?.userName) {
        errors.userName = "User name is required";
      } else if (!userNameRegex.test(userData.userName)) {
        errors.userName = "User name must be alphanumeric (no spaces)";
      }

      if (!rePassword) {
        errors.rePassword = "Please re-enter your password";
      } else if (userData.password !== rePassword) {
        errors.rePassword = "Passwords do not match";
      }
    }

    setErrorState(errors);

    const firstError = Object.values(errors).find((e) => e);
    if (firstError) {
      toastNotify(firstError, "error");
      return false;
    }

    return true;
  };
  const handleLoginSignup = async () => {
    const isValid = checkValidation();
    if (!isValid) return;

    const formData = {
      email: userData?.email,
      password: userData?.password,
    };

    try {
      if (type === "login") {
        // Call login API
        const { data } = await apiClient.post(
          `${import.meta.env.VITE_BASE_URL}/login`,
          formData
        );

        // Save email if Remember Me is checked
        if (rememberMe) {
          localStorage.setItem("userEmail", userData?.email);
        }

        login(data.accessToken, data.user);
        window.location.href = "/dashboard";
      } else {
        // Call signup API
        await apiClient.post(`${import.meta.env.VITE_BASE_URL}/users`, {
          ...formData,
          name: userData?.name,
          username: userData?.userName,
        });
        toastNotify("Account created successfully! Please log in.", "success");
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error during login/signup:", error);

      // Handle specific error cases
      const errorDetail = error?.response?.data?.detail;
      const statusCode = error?.response?.status;

      if (type === "login") {
        if (statusCode === 404) {
          toastNotify(
            "No account found with this email. Please sign up.",
            "error"
          );
        } else if (statusCode === 401) {
          toastNotify("Incorrect password. Please try again.", "error");
        } else if (errorDetail) {
          toastNotify(
            typeof errorDetail === "string"
              ? errorDetail
              : "Login failed. Please try again.",
            "error"
          );
        } else {
          toastNotify("Login failed. Please check your credentials.", "error");
        }
      } else {
        // Signup errors
        const errorMsg =
          typeof errorDetail === "string" ? errorDetail.toLowerCase() : "";
        if (statusCode === 400 && errorMsg.includes("email")) {
          toastNotify(
            "This email is already registered. Please log in instead.",
            "error"
          );
        } else if (statusCode === 400 && errorMsg.includes("username")) {
          toastNotify(
            "This username is already taken. Please choose another.",
            "error"
          );
        } else if (errorDetail) {
          toastNotify(
            typeof errorDetail === "string"
              ? errorDetail
              : "Signup failed. Please try again.",
            "error"
          );
        } else {
          toastNotify("Signup failed. Please try again.", "error");
        }
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm mx-auto shadow-[0_0_100px_rgba(0,0,0,0.2)]">
        <CardHeader className="text-center space-y-4 pt-12">
          <div className="flex justify-center items-center space-x-2">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0112 10a5.995 5.995 0 01-3 5.197"
              />
            </svg>
            <span className="text-3xl font-bold text-blue-800 tracking-wider">
              COLLABRYX
            </span>
          </div>

          <CardTitle className="text-2xl">
            {type === "login" ? "Log in to continue" : "Create an account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-12 pb-12">
          <div className="space-y-3">
            {/* Avatar Placeholder */}
            {type === "login" && (
              <div className="flex justify-center">
                <div className="w-28 h-28 bg-gray-700 rounded-full flex items-center justify-center">
                  <UserCircle2 className="w-16 h-16 text-gray-400" />
                </div>
              </div>
            )}

            {type === "sign-up" && (
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter Your Name"
                  value={userData?.name}
                  onChange={(e) =>
                    setUserData({ ...userData, name: e.target.value })
                  }
                  className={errorState.name ? "border-red-500" : ""}
                />
                {errorState.name && (
                  <p className="text-red-500 text-sm">{errorState.name}</p>
                )}
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter Your Email"
                value={userData?.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                className={errorState.email ? "border-red-500" : ""}
              />
              {errorState.email && (
                <p className="text-red-500 text-sm">{errorState.email}</p>
              )}
            </div>

            {type === "sign-up" && (
              <div className="space-y-1">
                <Label htmlFor="userName">User Name</Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Enter Prefered User Name"
                  value={userData?.userName}
                  onChange={(e) =>
                    setUserData({ ...userData, userName: e.target.value })
                  }
                  className={errorState.userName ? "border-red-500" : ""}
                />
                {errorState.userName && (
                  <p className="text-red-500 text-sm">{errorState.userName}</p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="password">
                {type === "sign-up" ? "Create Password" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter Your Password"
                value={userData?.password}
                onChange={(e) =>
                  setUserData({ ...userData, password: e.target.value })
                }
                className={errorState.password ? "border-red-500" : ""}
              />
              {errorState.password && (
                <p className="text-red-500 text-sm">{errorState.password}</p>
              )}
            </div>

            {type === "sign-up" && (
              <div className="space-y-1">
                <Label htmlFor="rePassword">Re-enter Password</Label>
                <Input
                  id="rePassword"
                  type="password"
                  placeholder="Re-Enter Your Password"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  className={errorState.rePassword ? "border-red-500" : ""}
                />
                {errorState.rePassword && (
                  <p className="text-red-500 text-sm">
                    {errorState.rePassword}
                  </p>
                )}
              </div>
            )}

            {type === "login" ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember-me"
                  value="remember-me"
                  checked={rememberMe}
                  onCheckedChange={handleRememberMe}
                />
                <Label htmlFor="remember-me" className="font-normal text-sm">
                  Remember me
                </Label>
              </div>
            ) : null}

            <Button
              className="w-full bg-black text-white hover:bg-gray-800"
              onClick={handleLoginSignup}
            >
              {type === "login" ? "Log In" : "Sign Up"}
            </Button>
          </div>

          {type === "login" ? (
            <div className="mt-20 text-center text-sm">
              <span
                className="font-medium text-blue-600 cursor-pointer hover:text-blue-800 hover:underline"
                onClick={handleForgotPasswordOpen}
              >
                Forgot Password?
              </span>
              <p className="mt-2 text-gray-600">
                New User?{" "}
                <a
                  href="/sign-up"
                  className="font-medium text-black hover:text-gray-700 underline"
                  onClick={() => {
                    handleRememberMe(false);
                    localStorage.removeItem("userEmail");
                    localStorage.removeItem("rememberMe");
                  }}
                >
                  Sign Up
                </a>
              </p>
            </div>
          ) : (
            <div className="mt-20 text-center text-sm">
              <a
                href="/login"
                className="font-medium text-gray-600 hover:text-black underline"
              >
                Existing User?{" "}
              </a>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPassword && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {forgotPasswordStep === 1
                      ? "Forgot Password"
                      : "Reset Password"}
                  </h2>
                  <button
                    onClick={handleForgotPasswordClose}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {forgotPasswordStep === 1 ? (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      Enter your email address to reset your password.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="Enter your email"
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value);
                          setForgotPasswordError("");
                        }}
                      />
                    </div>
                    {forgotPasswordError && (
                      <p className="text-red-500 text-sm">
                        {forgotPasswordError}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleForgotPasswordClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        onClick={handleVerifyEmail}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Verifying..." : "Continue"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">
                      Email verified: <strong>{forgotEmail}</strong>
                      <br />
                      Enter your new password below.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password (min 8 characters)"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setForgotPasswordError("");
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="Re-enter new password"
                        value={confirmNewPassword}
                        onChange={(e) => {
                          setConfirmNewPassword(e.target.value);
                          setForgotPasswordError("");
                        }}
                      />
                    </div>
                    {forgotPasswordError && (
                      <p className="text-red-500 text-sm">
                        {forgotPasswordError}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setForgotPasswordStep(1)}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1 bg-black text-white hover:bg-gray-800"
                        onClick={handleResetPassword}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Resetting..." : "Reset Password"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
