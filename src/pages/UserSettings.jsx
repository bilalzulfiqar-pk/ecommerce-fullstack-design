import { useContext, useEffect, useState } from "react";
import AuthContext from "../context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

import { ImSpinner2 } from "react-icons/im";

const MySwal = withReactContent(Swal);

const UserSettings = () => {
  const { user, fetchUser } = useContext(AuthContext);
  const [canResend, setCanResend] = useState(true);
  const [resendTimer, setResendTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const token = localStorage.getItem("token");
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  // Keep the form’s initial name in sync with the user’s current name
  useEffect(() => {
    if (user?.name) {
      // Formik’s initialValues will pick this up via enableReinitialize
    }
  }, [user]);

  // ─── On mount: ask backend “when can I next request an OTP?” ───────────────
  useEffect(() => {
    async function fetchOtpCooldown() {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/email/otp-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { nextAllowedAt } = res.data;
        if (nextAllowedAt) {
          const millisLeft = nextAllowedAt - Date.now();
          if (millisLeft > 0) {
            setCanResend(false);
            setResendTimer(Math.ceil(millisLeft / 1000));
          }
        }
      } catch (err) {
        // If no record or error, leave canResend = true
        console.error("Could not fetch OTP cooldown:", err);
      } finally {
        setIsCheckingStatus(false);
      }
    }
    fetchOtpCooldown();
  }, [API_BASE_URL, token]);

  // Start a countdown whenever canResend becomes false
  // ─── Countdown logic: tick resendTimer down to 0 ──────────────────────────
  useEffect(() => {
    let timerId;
    if (!canResend && resendTimer > 0) {
      timerId = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
    } else if (!canResend && resendTimer === 0) {
      // Re-enable the resend button
      setCanResend(true);
    }
    return () => clearTimeout(timerId);
  }, [canResend, resendTimer]);

  /**
   * handleEmailVerifySubmit:
   *  1) Calls /api/email/send-verification-otp
   *  2) Disables “Resend” for 60s (setCanResend(false))
   *  3) Shows SweetAlert2 input box for OTP entry
   *     – if user submits, call /api/email/verify-otp
   */
  const handleEmailVerifySubmit = async () => {
    try {
      setIsSendingOtp(true);

      // Call backend to send OTP
      const res = await axios.post(
        `${API_BASE_URL}/api/email/send-verification-otp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsSendingOtp(false);

      // Backend returned 200 with { success: true, nextAllowedAt }
      if (res.data.success) {
        const { nextAllowedAt } = res.data;
        const millisLeft = nextAllowedAt - Date.now();
        const secondsLeft = Math.ceil(millisLeft / 1000);

        setCanResend(false);
        setResendTimer(secondsLeft);

        // Show SweetAlert2 prompt with six OTP boxes
        MySwal.fire({
          title: "Enter the 6-digit code sent to your email",
          html: `
          <div id="otp-container" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem;">
            ${[...Array(6)]
              .map(
                (_, i) => `
              <input 
                id="otp-${i}" 
                type="text" 
                inputmode="numeric" 
                maxlength="1" 
                style="
                  width: 3rem; 
                  height: 3rem; 
                  font-size: 1.5rem; 
                  text-align: center; 
                  border: 1px solid #ccc; 
                  border-radius: 0.25rem;
                  transition: border-color 0.3s ease, box-shadow 0.3s ease;
                "
                oninput="this.value = this.value.replace(/[^0-9]/g, '');"
              />
            `
              )
              .join("")}
          </div>
          <style>
            /* Focus style for each OTP box using Tailwind-like rules */
            #otp-container input {
              /* transition duration-300 */
              transition: border-color 0.3s ease, box-shadow 0.3s ease;
            }
            #otp-container input:focus {
              outline: none;                        /* focus:outline-none */
              border-color: #93c5fd;                /* focus:border-blue-300 */
              box-shadow: 0 0 0 4px rgba(191, 219, 254, 0.5); /* focus:ring-4 focus:ring-blue-200 focus:ring-opacity-50 */
            }
          </style>
        `,
          showCancelButton: true,
          confirmButtonText: "Submit OTP",
          cancelButtonText: "Cancel",
          showLoaderOnConfirm: true,
          allowOutsideClick: () => !Swal.isLoading(),
          didOpen: () => {
            const inputs = Array.from(
              document.querySelectorAll("#otp-container input")
            );

            // Focus the first box on open
            inputs[0].focus();

            inputs.forEach((input, idx) => {
              input.addEventListener("keydown", (e) => {
                const key = e.key;
                if (key === "Backspace" && input.value === "" && idx > 0) {
                  inputs[idx - 1].focus();
                }
              });

              // input.addEventListener("input", () => {
              //   const val = input.value;
              //   // If user pastes more than one character, keep only the first
              //   if (val.length > 1) {
              //     input.value = val.charAt(0);
              //   }
              //   // Move to next box if current has a digit
              //   if (val.match(/[0-9]/) && idx < inputs.length - 1) {
              //     inputs[idx + 1].focus();
              //   }
              // });

              // Handle a full‐OTP paste on any box:
              input.addEventListener("paste", (e) => {
                e.preventDefault();
                const pasteData = (e.clipboardData || window.clipboardData)
                  .getData("text")
                  .trim();
                // Extract only digits, up to 6 characters
                const digits = pasteData
                  .replace(/\D/g, "")
                  .split("")
                  .slice(0, 6);

                // Distribute each digit into the inputs array
                digits.forEach((ch, i) => {
                  if (inputs[i]) {
                    inputs[i].value = ch;
                  }
                });

                // Focus the box after the last pasted character (or the last box)
                const nextIndex = Math.min(digits.length, inputs.length - 1);
                inputs[nextIndex].focus();
              });

              // Simplified “single‐digit” input handler:
              input.addEventListener("input", () => {
                const val = input.value;
                // If the user typed a non‐digit, clear it
                if (!/^[0-9]$/.test(val)) {
                  input.value = "";
                  return;
                }
                // Otherwise (exactly one digit), move focus to the next box
                if (idx < inputs.length - 1) {
                  inputs[idx + 1].focus();
                }
              });
            });
          },
          preConfirm: () => {
            // Gather all six digits
            const inputs = Array.from(
              document.querySelectorAll("#otp-container input")
            );
            const otpValue = inputs.map((i) => i.value).join("");
            if (!/^[0-9]{6}$/.test(otpValue)) {
              Swal.showValidationMessage("Please enter all 6 digits");
              return;
            }
            return otpValue;
          },
        }).then(async (result) => {
          if (result.isConfirmed) {
            const otp = result.value;
            try {
              // Call backend to verify OTP
              const verifyRes = await axios.post(
                `${API_BASE_URL}/api/email/verify-otp`,
                { otp },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              if (verifyRes.data.success) {
                Swal.fire(
                  "Verified!",
                  "Your email is now verified.",
                  "success"
                );
                // Refresh user context so `user.isEmailVerified` becomes true
                await fetchUser();
              } else {
                Swal.fire(
                  "Error",
                  "Unexpected verification response.",
                  "error"
                );
              }
            } catch (err) {
              // If verification fails, show error and retry
              const fieldErrors = err.response?.data?.errors;
              if (fieldErrors) {
                const otpError = fieldErrors.find((e) => e.path === "otp");
                const msg = otpError ? otpError.msg : "Invalid OTP.";
                Swal.fire("Invalid OTP", msg, "error").then(() => {
                  // Re-open the prompt so they can try again
                  handleEmailVerifySubmit();
                });
              } else {
                Swal.fire(
                  "Error",
                  err.response?.data?.msg || "Verification failed.",
                  "error"
                );
              }
            }
          }
        });
      } else {
        // In case something else blocks
        Swal.fire("Error", res.data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      setIsSendingOtp(false);
      // If backend returned 429 (cooldown not elapsed):
      if (err.response?.status === 429) {
        const { nextAllowedAt } = err.response.data;
        const millisLeft = nextAllowedAt - Date.now();
        if (millisLeft > 0) {
          setCanResend(false);
          setResendTimer(Math.ceil(millisLeft / 1000));
        }
        return Swal.fire(
          "Please wait",
          err.response.data.msg || "Try again later.",
          "warning"
        );
      }

      // Other errors
      Swal.fire(
        "Error",
        err.response?.data?.msg || "Could not send OTP.",
        "error"
      );
    }
  };

  //
  // ─── Formik + Yup SCHEMAS ────────────────────────────────────────────────────
  //

  // Schema for updating name (mirror backend: non‐empty, min 3 chars, letters+spaces)
  const nameSchema = Yup.object().shape({
    name: Yup.string()
      .required("Name is required")
      .min(3, "Name must be at least 3 characters")
      .matches(/^[A-Za-z\s]+$/, "Name can only contain letters and spaces"),
  });

  // Schema for updating password (match backend: current required, new ≥6, digit, letter, confirm must equal)
  const passwordSchema = Yup.object().shape({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .required("New password is required")
      .min(6, "Password must be at least 6 characters")
      .matches(/\d/, "Password must contain at least one number")
      .matches(/[a-zA-Z]/, "Password must contain at least one letter")
      .test(
        "not-same-as-current",
        "New password cannot be the same as current password",
        function (value) {
          return value !== this.parent.currentPassword;
        }
      ),
    confirmPassword: Yup.string()
      .required("Please confirm your new password")
      .oneOf([Yup.ref("newPassword")], "Passwords must match"),
  });

  //
  // ─── RENDER ─────────────────────────────────────────────────────────────────
  //
  return (
    <div className="w-full py-10 bg-gray-100 min-h-[85vh] min-h-dvh-85 flex items-center justify-center">
      <div className="max-w-2xl mx-4 p-6 bg-white w-xl rounded-xl h-fit shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

        {/* ─── UPDATE NAME FORM ───────────────────────────────────────────────── */}
        <Formik
          enableReinitialize
          initialValues={{ name: user?.name || "" }}
          validationSchema={nameSchema}
          validateOnBlur={false} // validate on blur //remove these two to want default behavior
          validateOnChange={true} // validate on change
          onSubmit={async (
            values,
            { setSubmitting, setFieldError, resetForm }
          ) => {
            // Ask for confirmation
            const result = await MySwal.fire({
              title: "Are you sure?",
              text: "You want to change your name?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Yes, update it!",
            });

            if (!result.isConfirmed) {
              setSubmitting(false);
              return;
            }

            try {
              await axios.put(
                `${API_BASE_URL}/api/users/update-name`,
                { name: values.name },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              MySwal.fire("Updated!", "Your name has been updated.", "success");
              await fetchUser(); // refresh user info
              // Optionally resetForm({ values: { name: values.name } })
            } catch (error) {
              // Backend might return validation errors as an array
              if (error.response?.data?.errors) {
                error.response.data.errors.forEach(({ msg, path }) => {
                  setFieldError(path, msg);
                });
              } else {
                // Generic error
                MySwal.fire(
                  "Error",
                  error.response?.data?.msg || "Failed to update name.",
                  "error"
                );
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Field
                name="name"
                type="text"
                placeholder="Your full name"
                className={`w-full px-4 py-2 border ${
                  errors.name && touched.name
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md
                  focus:outline-none
                  focus:border-blue-300
                  focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50
                  transition duration-300
                `}
              />
              <ErrorMessage
                name="name"
                component="p"
                className="text-red-500 text-sm mt-1"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 px-4 w-full py-2 flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 cursor-pointer disabled:cursor-auto disabled:opacity-70 disabled:hover:bg-blue-600"
              >
                {isSubmitting && (
                  <ImSpinner2 className="animate-spin text-xl" />
                )}
                <span>{isSubmitting ? "Updating…" : "Update Name"}</span>
              </button>
            </Form>
          )}
        </Formik>

        {/* ─── EMAIL DISPLAY + VERIFY BUTTON ────────────────────────────────────────── */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="w-full px-4 py-2 border border-gray-300 bg-gray-100 text-gray-700 rounded-md select-none">
            {user?.email || ""}
          </div>
          <button
            type="button"
            disabled={
              user?.isEmailVerified === true ||
              !canResend ||
              isSendingOtp ||
              isCheckingStatus
            }
            onClick={handleEmailVerifySubmit}
            className={`
              mt-4 px-4 w-full py-2 rounded-md flex items-center justify-center gap-2
              ${
                user?.isEmailVerified
                  ? "bg-green-600 cursor-auto opacity-80 text-white"
                  : isSendingOtp
                  ? "bg-yellow-500 cursor-not-allowed text-white"
                  : canResend
                  ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                  : "bg-gray-400 cursor-not-allowed text-white"
              }
              transition duration-200
            `}
          >
            {user?.isEmailVerified ? (
              "Verified"
            ) : isCheckingStatus ? (
              "Checking…"
            ) : isSendingOtp ? (
              <>
                <ImSpinner2 className="animate-spin text-xl" />
                <span>Sending OTP…</span>
              </>
            ) : canResend ? (
              "Verify Email"
            ) : (
              `Resend in ${resendTimer}s`
            )}
          </button>
        </div>

        {/* ─── UPDATE PASSWORD FORM ─────────────────────────────────────────────── */}
        <Formik
          initialValues={{
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }}
          validationSchema={passwordSchema}
          validateOnBlur={false} // validate on blur //remove these two to want default behavior
          validateOnChange={true} // validate on change
          onSubmit={async (
            values,
            { setSubmitting, setFieldError, resetForm }
          ) => {
            // Ask for confirmation
            const result = await MySwal.fire({
              title: "Are you sure?",
              text: "You want to change your password?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Yes, change it!",
            });

            if (!result.isConfirmed) {
              setSubmitting(false);
              return;
            }

            try {
              await axios.put(
                `${API_BASE_URL}/api/users/update-password`,
                {
                  currentPassword: values.currentPassword,
                  newPassword: values.newPassword,
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              MySwal.fire(
                "Success",
                "Password updated successfully!",
                "success"
              );
              resetForm(); // Clear all password fields
            } catch (error) {
              if (error.response?.data?.errors) {
                // Map each backend validation error (param will be one of our fields)
                error.response.data.errors.forEach(({ msg, path }) => {
                  setFieldError(path, msg);
                });
              } else {
                // Generic or “Invalid credentials” style error
                MySwal.fire(
                  "Error",
                  error.response?.data?.msg || "Failed to update password.",
                  "error"
                );
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting, errors, touched }) => (
            <Form>
              {/* Current Password */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <Field
                name="currentPassword"
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-2 border ${
                  errors.currentPassword && touched.currentPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md
                  focus:outline-none
                  focus:border-blue-300
                  focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50
                  transition duration-300
                  mb-3
                `}
                autoComplete="current-password"
              />
              <ErrorMessage
                name="currentPassword"
                component="p"
                className="text-red-500 text-sm mb-3"
              />

              {/* New Password */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <Field
                name="newPassword"
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-2 border ${
                  errors.newPassword && touched.newPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md
                  focus:outline-none
                  focus:border-blue-300
                  focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50
                  transition duration-300
                  mb-3
                `}
                autoComplete="new-password"
              />
              <ErrorMessage
                name="newPassword"
                component="p"
                className="text-red-500 text-sm mb-3"
              />

              {/* Confirm New Password */}
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <Field
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-2 border ${
                  errors.confirmPassword && touched.confirmPassword
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md
                  focus:outline-none
                  focus:border-blue-300
                  focus:ring-3 focus:ring-blue-200 focus:ring-opacity-50
                  transition duration-300
                  mb-4
                `}
                autoComplete="new-password"
              />
              <ErrorMessage
                name="confirmPassword"
                component="p"
                className="text-red-500 text-sm mb-4"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 w-full flex items-center justify-center gap-2 cursor-pointer bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 disabled:cursor-auto disabled:opacity-70 disabled:hover:bg-blue-600"
              >
                {isSubmitting && (
                  <ImSpinner2 className="animate-spin text-xl" />
                )}
                <span>{isSubmitting ? "Changing…" : "Update Password"}</span>
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default UserSettings;
