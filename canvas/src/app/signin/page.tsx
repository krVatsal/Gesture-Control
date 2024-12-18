"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Github } from 'lucide-react';
import GestureCanvas from "@/components/GestureCanvas";
import { signIn } from "next-auth/react";
const SignInPage = () => {
  const router = useRouter();



  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Draw your gesture pattern below</p>
        </div>

        <GestureCanvas />

        <div className="mt-8">
{/* <a href="/api/google"> */}
          <button
              type="submit" name="action" value="google" onClick={()=>signIn}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>
          {/* </a> */}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Draw a gesture pattern and authenticate with Google to continue</p>
        </div>
<a href="https://github.com/krVatsal/Gesture-Control">

        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-center space-x-2 text-gray-600">
          <Github className="w-4 h-4" />
          <button>Open Source Project</button>
        </div>
        </a>
      </div>
    </div>
  );
}

// export async function getServerSideProps({ req, res }) {
//   try {
//     const cookieExists = getCookie("token", { req, res });
//     console.log(cookieExists);
//     if (cookieExists) return { redirect: { destination: "/dashboard" } };
//     return { props: {} };
//   } catch (err) {
//     return { props: {} };
//   }
// }

export default SignInPage;
