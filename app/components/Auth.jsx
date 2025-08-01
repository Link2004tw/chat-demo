"use client";

import { auth } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { useState } from "react";
import Cookies from "universal-cookie";

import Card from "./Card";
import PrimaryButton from "./PrimaryButton";
import TextInput from "./TextInput";

const cookies = new Cookies();

export default function Auth({ setAuth }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState(""); // New state for name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async () => {
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);

        // Set user's display name
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            displayName: name,
          });
        }
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }

      const token = result.user.refreshToken;
      cookies.set("auth-token", token);
      setAuth(true);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card
        title={isSignUp ? "Create a New Account" : "Sign In to Continue"}
        className="p-6 justify-center items-center"
      >
        <div className="space-y-4">
          {isSignUp && (
            <TextInput
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <TextInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="relative">
            <TextInput
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <div className="flex items-center justify-center">
            <PrimaryButton onClick={handleEmailAuth}>
              {isSignUp ? "Sign Up" : "Sign In"}
            </PrimaryButton>
          </div>

          <p
            className="text-sm text-center text-blue-600 cursor-pointer"
            onClick={() => setIsSignUp((prev) => !prev)}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </p>
        </div>
      </Card>
    </div>
  );
}
