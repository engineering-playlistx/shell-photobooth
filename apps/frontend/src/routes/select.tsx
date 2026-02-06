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
          background: `url('${getAssetPath("/images/bg-app.png")}')`,
          backgroundSize: "cover",
        }}
      />
      <button
        onClick={() => {
          void navigate("/");
        }}
        className="absolute top-22 left-32 z-20 transition-all duration-200 active:scale-95 flex flex-col align-left items-start gap-2 text-secondary text-2xl"
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
      <div className="relative z-10 w-full px-24 flex flex-col items-center gap-12">
        <h1 className="text-5xl lg:text-6xl font-bold font-sans text-center">
          Choose Your Look
        </h1>
        <div className="flex flex-col gap-8 w-full">
          {(Object.keys(RACING_THEMES) as RacingTheme[]).map((themeKey) => {
            const theme = RACING_THEMES[themeKey];
            return (
              <button
                key={themeKey}
                onClick={() => handleSelectTheme(themeKey)}
                className="relative w-full rounded-2xl overflow-hidden shadow-xl cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-2xl select-none"
              >
                <div className="relative w-full h-64 lg:h-80 bg-secondary/20">
                  <img
                    src={getAssetPath(THEME_IMAGES[themeKey])}
                    alt={theme.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white text-left">
                    <h2 className="text-4xl lg:text-5xl font-bold font-sans">
                      {theme.title}
                    </h2>
                    <p className="text-xl lg:text-2xl font-sans mt-1 opacity-90">
                      {theme.description}
                    </p>
                  </div>
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
