"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useDebounceCallback } from "usehooks-ts";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { signUpSchema } from "@/schemas/signUpSchema";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const SignUpPage = () => {
  const [username, setUsername] = useState("");
  const [usernameMessage, setUsernameMessage] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const debounced = useDebounceCallback(setUsername, 300);
  const router = useRouter();

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      gender: undefined,
    },
  });

  useEffect(() => {
    const checkUsernameUnique = async () => {
      if (username.length < 3) {
        setUsernameMessage("");
        return;
      }

      setIsCheckingUsername(true);
      setUsernameMessage("");

      try {
        const response = await axios.get(
          `/api/check-username-unique?username=${username}`
        );

        setUsernameMessage(response?.data?.message);
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        setUsernameMessage(
          axiosError.response?.data?.message ?? "Error checking username"
        );
      } finally {
        setIsCheckingUsername(false);
      }
    };

    checkUsernameUnique();
  }, [username]);

  const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
    if (!data.gender) {
      toast.error("Please select a gender");
      return;
    }

    setIsSubmitting(true);
    try {
      const { username, email, password, gender } = data;

      const response = await axios.post("/api/sign-up", {
        username,
        email,
        password,
        gender,
      });

      toast.success(response.data.message || "Account created successfully!");
      router.replace(`/verify/${username}`);
    } catch (error) {
      console.error("Error in signup of user", error);
      const axiosError = error as AxiosError<ApiResponse>;
      let errorMessage = axiosError.response?.data?.message;
      toast.error(`Signup failed${errorMessage ? `: ${errorMessage}` : ""}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4">
      <Toaster position="top-center" richColors />

      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-center border-b border-gray-700">
          <h1 className="text-3xl font-bold text-white">Join Our Platform</h1>
          <p className="text-gray-300 mt-2">Create your account in seconds</p>
        </div>

        <div className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Username
              </label>
              <div className="relative">
                <input
                  {...form.register("username")}
                  type="text"
                  id="username"
                  onChange={(e) => {
                    form.setValue("username", e.target.value);
                    debounced(e.target.value);
                  }}
                  className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border ${
                    form.formState.errors.username
                      ? "border-red-500"
                      : "border-gray-600"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="Enter your username"
                />
                {isCheckingUsername && (
                  <div className="absolute right-3 top-3.5">
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  </div>
                )}
              </div>
              {form.formState.errors.username ? (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {form.formState.errors.username.message}
                </p>
              ) : (
                usernameMessage && (
                  <p
                    className={`mt-2 text-sm flex items-center ${
                      usernameMessage === "Username is available"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {usernameMessage === "Username is available" ? (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-1" />
                    )}
                    {usernameMessage}
                  </p>
                )
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                {...form.register("email")}
                type="email"
                id="email"
                className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border ${
                  form.formState.errors.email
                    ? "border-red-500"
                    : "border-gray-600"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="your@email.com"
              />
              {form.formState.errors.email && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <input
                {...form.register("password")}
                type="password"
                id="password"
                className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 border ${
                  form.formState.errors.password
                    ? "border-red-500"
                    : "border-gray-600"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                placeholder="Create a password"
              />
              {form.formState.errors.password && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Gender
              </label>
              <select
                {...form.register("gender", { required: "Gender is required" })}
                id="gender"
                className={`w-full px-4 py-3 rounded-lg bg-gray-700 text-white border ${
                  form.formState.errors.gender
                    ? "border-red-500"
                    : "border-gray-600"
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                defaultValue=""
              >
                <option value="" disabled>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {form.formState.errors.gender && (
                <p className="mt-2 text-sm text-red-400 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {form.formState.errors.gender.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <button
                onClick={() => router.push("/signin")}
                className="text-blue-400 font-medium hover:text-blue-300 focus:outline-none transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
