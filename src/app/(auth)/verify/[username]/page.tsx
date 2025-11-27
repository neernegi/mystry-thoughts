'use client'

import { verifySchema } from "@/schemas/verifySchema";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Mail } from "lucide-react";

function VerifyAccount() {
  const router = useRouter();
  const params = useParams<{ username: string }>();

  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: {
      code: "",
      username: params.username 
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    try {
      const response = await axios.post(`/api/verify-code`, {
        username: params.username,
        code: data.code,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        router.replace("/sign-in");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Error in verification:", error);
      const axiosError = error as AxiosError<ApiResponse<any>>;
      let errorMessage = axiosError.response?.data?.message || "Verification failed";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center p-4">
      <Toaster richColors position="top-center" />
      <Card className="w-full max-w-md shadow-2xl rounded-xl overflow-hidden border border-gray-700">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8 text-white border-b border-gray-700">
          <CardHeader className="space-y-2 p-0">
            <CardTitle className="text-3xl font-bold">Verify Your Identity</CardTitle>
            <CardDescription className="text-gray-300">
              We've sent a verification code to your email
            </CardDescription>
          </CardHeader>
        </div>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Verification Code</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="Enter 6-digit code"
                          className="pl-4 pr-12 py-3 text-base bg-gray-800 border-gray-700 text-white placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          maxLength={6}
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Mail className="h-5 w-5" />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      Check your email for the verification code
                    </FormDescription>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Account"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm text-gray-400">
            Didn't receive a code?{" "}
            <button
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              onClick={async () => {
                try {
                  const response = await axios.post('/api/resend-verification', {
                    username: params.username
                  });
                  toast.success(response.data.message);
                } catch (error) {
                  toast.error("Failed to resend verification code");
                }
              }}
            >
              Resend code
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyAccount;