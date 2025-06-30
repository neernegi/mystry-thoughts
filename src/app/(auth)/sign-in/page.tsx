"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast, Toaster } from "sonner";
import { useRouter } from "next/navigation";
import { signInSchema } from "@/schemas/signInSchema";
import { signIn } from "next-auth/react";
import { Loader2, Lock, Mail, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const SignInPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await signIn('credentials', {
        redirect: false,
        identifier: data.email,
        password: data.password,
        callbackUrl: '/dashboard' // Add this
      });

      console.log('Sign-in response:', response); // Debug log

      if (response?.error) {
        toast.error("Incorrect username or password");
      } else if (response?.ok) {
        // Check if sign-in was successful
        toast.success("Signed in successfully!");
        // Try using Next.js router with a delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Sign-in error:', error); // Debug log
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4">
      <Toaster position="top-center" richColors />

      <Card className="w-full max-w-md border border-gray-700 overflow-hidden shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 border-b border-gray-700">
          <div className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-300">
              Sign in to access your dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  {...form.register("email")}
                  id="identifier"
                  type="text"
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-400 flex items-center mt-1">
                  <XCircle className="h-4 w-4 mr-1" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  {...form.register("password")}
                  id="password"
                  type="password"
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-400 flex items-center mt-1">
                  <XCircle className="h-4 w-4 mr-1" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => toast.info("Password reset functionality would go here")}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/sign-up")}
              className="text-blue-400 font-medium hover:text-blue-300 focus:outline-none transition-colors"
            >
              Sign up
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;