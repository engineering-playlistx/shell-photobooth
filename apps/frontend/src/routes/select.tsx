import React from "react";
import { useNavigate } from "react-router-dom";
import { RACING_THEMES, usePhotobooth } from "../contexts/PhotoboothContext";
import type { RacingTheme } from "../contexts/PhotoboothContext";
import { getAssetPath } from "../utils/assets";

const THEME_IMAGES: Record<RacingTheme, string> = {
  pitcrew: "/images/theme-pitcrew.png",
  motogp: "/images/theme-motogp.png",
  f1: "/images/theme-f1.png",
};

function SelectPage() {
  const navigate = useNavigate();
  const { setSelectedTheme } = usePhotobooth();

  function handleSelectTheme(theme: RacingTheme) {
    setSelectedTheme({ theme });
    void navigate("/camera");
  }

  return (
    <div className="h-svh aspect-9/16 mx-auto relative flex flex-col items-center justify-center bg-primary text-secondary overflow-hidden">
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `url('${getAssetPath("/images/bg_select.png")}')`,
          backgroundSize: "cover",
        }}
      />
      <button
        onClick={() => {
          void navigate("/");
        }}
        className="absolute top-22 left-32 z-20 transition-all duration-200 active:scale-95 flex flex-row align-left items-center  gap-4 text-secondary text-4xl font-medium"
        aria-label="Back to home"
      >
        <div className="p-3 bg-secondary rounded-full shadow-lg transition-all duration-200 active:scale-95 flex flex-row">
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
        Back
      </button>
      <div className="relative z-10 w-full px-24 flex flex-col items-center gap-12 mb-40">
        <h1 className="text-7xl font-shell font-black font-bold font-sans text-center w-180">
          Who do you want to be today?
        </h1>
        <p className="text-5xl font-medium pt-8 py-20">
          Choose your racing role:
        </p>
        <div className="flex flex-col gap-18 w-full">
          {(Object.keys(RACING_THEMES) as RacingTheme[]).map((themeKey) => {
            const theme = RACING_THEMES[themeKey];
            return (
              <button
                key={themeKey}
                onClick={() => handleSelectTheme(themeKey)}
                className="relative w-full rounded-4xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-2xl select-none font-shell font-medium"
              >
                <div className="relative flex flex-row items-center gap-14 w-full bg-tertiary">
                  <div className="bg-white p-4">
                    <img
                      src={getAssetPath(THEME_IMAGES[themeKey])}
                      alt={theme.title}
                      className="w-28 h-28"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                  <h2 className="text-7xl text-white">{theme.title}</h2>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default SelectPage;
