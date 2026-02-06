"use client";

import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePhotobooth } from "../contexts/PhotoboothContext";
import { getAssetPath } from "../utils/assets";
import SimpleKeyboard from "../components/SimpleKeyboard";

export default function FormPage() {
  const navigate = useNavigate();

  const { setUserInfo } = usePhotobooth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [layoutName, setLayoutName] = useState("default");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const activeInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShowKeyboard(false);
    setUserInfo({ name, email, phone });
    void navigate("/loading");
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    activeInputRef.current = e.target;
    setShowKeyboard(true);
  };

  const handleInputBlur = () => {
    // Don't hide keyboard when clicking on it
    // The keyboard will be hidden when form is submitted or user explicitly closes it
  };

  const handleKeyPress = useCallback(
    (button: string) => {
      if (!activeInputRef.current) return;

      const input = activeInputRef.current;
      const currentValue = input.value;
      const selectionStart = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      let newValue = currentValue;

      if (button === "{bksp}") {
        // Handle backspace
        if (selectionStart === selectionEnd && selectionStart > 0) {
          newValue =
            currentValue.slice(0, selectionStart - 1) +
            currentValue.slice(selectionStart);
        } else if (selectionStart !== selectionEnd) {
          newValue =
            currentValue.slice(0, selectionStart) +
            currentValue.slice(selectionEnd);
        }
      } else if (button === "{shift}") {
        // Toggle shift layout
        setLayoutName((prev) => (prev === "default" ? "shift" : "default"));
        return;
      } else if (button === "{space}") {
        newValue =
          currentValue.slice(0, selectionStart) +
          " " +
          currentValue.slice(selectionEnd);
      } else if (button === "{enter}") {
        // Move to next input
        if (input === nameInputRef.current && emailInputRef.current) {
          emailInputRef.current.focus();
        } else if (input === emailInputRef.current && phoneInputRef.current) {
          phoneInputRef.current.focus();
        } else {
          setShowKeyboard(false);
          input.blur();
        }
        return;
      } else if (button === "{tab}" || button === "{lock}") {
        return;
      } else {
        // Regular character
        newValue =
          currentValue.slice(0, selectionStart) +
          button +
          currentValue.slice(selectionEnd);
      }

      // Update the appropriate state
      if (input === nameInputRef.current) {
        setName(newValue);
      } else if (input === emailInputRef.current) {
        setEmail(newValue);
      } else if (input === phoneInputRef.current) {
        setPhone(newValue);
      }

      // Set cursor position after state update
      requestAnimationFrame(() => {
        if (!activeInputRef.current) return;

        if (button === "{bksp}") {
          const newPos =
            selectionStart === selectionEnd
              ? Math.max(0, selectionStart - 1)
              : selectionStart;
          activeInputRef.current.setSelectionRange(newPos, newPos);
        } else if (button !== "{shift}" && button !== "{enter}") {
          const newPos = selectionStart + button.length;
          activeInputRef.current.setSelectionRange(newPos, newPos);
        }

        // Keep focus on the input
        if (activeInputRef.current) {
          activeInputRef.current.focus();
        }
      });
    },
    [nameInputRef, emailInputRef, phoneInputRef],
  );

  return (
    <div
      className="h-svh aspect-9/16 mx-auto bg-cover bg-center bg-no-repeat flex items-start justify-center p-4 bg-primary text-secondary"
      style={{
        backgroundImage: `url('${getAssetPath("/images/bg-app.png")}')`,
      }}
    >
      <button
        onClick={() => {
          void navigate("/");
        }}
        className="absolute top-22 left-32 z-20 transition-all duration-200 active:scale-95 flex flex-col align-left items-start  gap-2 text-secondary text-2xl"
        aria-label="Back to home"
      >
        <div className="p-5 bg-secondary/80 hover:bg-secondary rounded-full shadow-lg transition-all duration-200 active:scale-95 flex flex-row">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </div>
        Homepage
      </button>
      <div className="w-full px-32 lg:px-40 mx-auto mt-92">
        <div className="mb-4 text-center">
          <h1 className="text-7xl text-balance mb-2">Fill your data</h1>
        </div>

        <form
          className="flex flex-col gap-2 mb-8 text-2xl"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-5">
            <label className="font-sans mb-0 mt-2" htmlFor="name">
              Name
            </label>
            <input
              ref={nameInputRef}
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Your name here"
              className="w-full px-4 py-3 text-3xl lg:text-4xl font-serif bg-milk-white rounded-lg border border-secondary/40 focus:outline-none focus:border-tertiary transition-all"
              autoComplete="off"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-5">
            <label className="font-sans mb-0 mt-2" htmlFor="email">
              E-mail Address
            </label>
            <input
              ref={emailInputRef}
              id="email"
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="name@email.com"
              className="w-full px-4 py-3 text-3xl lg:text-4xl font-serif bg-milk-white rounded-lg border border-secondary/40 focus:outline-none focus:border-tertiary transition-all"
              autoComplete="off"
              pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
              required
            />
          </div>

          <div className="flex flex-col gap-5">
            <label className="font-sans mb-0 mt-2" htmlFor="phone">
              Phone Number
            </label>
            <input
              ref={phoneInputRef}
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="Your phone number"
              className="w-full px-4 py-3 text-3xl lg:text-4xl font-serif bg-milk-white rounded-lg border border-secondary/40 focus:outline-none focus:border-tertiary transition-all"
              autoComplete="off"
              pattern="(\+62|62|0)[0-9\-]{9,15}"
              title="Please enter a valid phone number, example: 0812-3456-7890 or +6281234567890"
              required
            />
          </div>

          <div className="flex items-start gap-3 mt-8">
            <input
              id="consent"
              type="checkbox"
              checked={isConsentChecked}
              onChange={(e) => setIsConsentChecked(e.target.checked)}
              required
              className="mt-1 w-6 h-6 accent-tertiary border-secondary/50 rounded"
              style={{ minWidth: "1.5rem", minHeight: "1.5rem" }}
            />
            <label
              htmlFor="consent"
              className="text-lg lg:text-2xl font-sans select-none"
            >
              I consent to L’Occitane collecting and using my personal data so I
              can receive and download my photo.
            </label>
          </div>

          <div className="flex justify-center mt-8">
            <button
              type="submit"
              className="px-10 py-5 bg-secondary hover:bg-tertiary text-white rounded-lg font-medium text-3xl lg:text-5xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none font-sans"
            >
              Get Result
            </button>
          </div>
        </form>
      </div>
      {showKeyboard && (
        <SimpleKeyboard onKeyPress={handleKeyPress} layoutName={layoutName} />
      )}
    </div>
  );
}
