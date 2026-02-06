import React, { useState, useEffect } from "react";

interface OnScreenKeyboardProps {
  isVisible: boolean;
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  inputType?: string;
}

export default function OnScreenKeyboard({
  isVisible,
  onKeyPress,
  onBackspace,
  onEnter,
  inputType = "text",
}: OnScreenKeyboardProps) {
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [isCapsLock, setIsCapsLock] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setIsShiftActive(false);
      setIsCapsLock(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const isUppercase = isShiftActive || isCapsLock;

  const getKeyboardLayout = () => {
    if (inputType === "tel") {
      return [
        ["1", "2", "3", undefined],
        ["4", "5", "6", undefined],
        ["7", "8", "9", undefined],
        ["+", "0", "-", "DELETE"],
      ];
    }

    if (inputType === "email") {
      const baseLayout = [
        ["@", ".", "-", "_"],
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
        ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
        ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
        ["z", "x", "c", "v", "b", "n", "m", "DELETE"],
      ];
      if (isUppercase) {
        return baseLayout.map((row) =>
          row.map((key) => (/^[a-z]$/.test(key) ? key.toUpperCase() : key)),
        );
      }
      return baseLayout;
    }

    const baseLayout = [
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["CAPS", "z", "x", "c", "v", "b", "n", "m", "DELETE"],
    ];
    if (isUppercase) {
      return baseLayout.map((row) =>
        row.map((key) => (/^[a-z]$/.test(key) ? key.toUpperCase() : key)),
      );
    }
    return baseLayout;
  };

  const keyboardLayout = getKeyboardLayout();

  function handleKeyClick(key: string) {
    const keyToPress =
      isUppercase && /^[a-z]$/.test(key) ? key.toUpperCase() : key;
    onKeyPress(keyToPress);

    if (isShiftActive && !isCapsLock) {
      setIsShiftActive(false);
    }
  }

  function handleBackspaceClick() {
    onBackspace();
  }

  function handleEnterClick() {
    onEnter();
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-milk-white border-t-2 border-secondary/20 shadow-lg z-50 animate-slide-up pb-60"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col gap-3">
          {keyboardLayout.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-3 justify-center">
              {row.map((key, keyIndex) => {
                if (key === undefined) {
                  return (
                    <div
                      key={`${rowIndex}-${keyIndex}`}
                      className="w-16 lg:w-20"
                    ></div>
                  );
                } else if (key === "CAPS") {
                  return (
                    <button
                      key={`${rowIndex}-${keyIndex}-${key}`}
                      type="button"
                      onClick={() => {
                        if (isCapsLock) {
                          setIsCapsLock(false);
                          setIsShiftActive(false);
                        } else if (isShiftActive) {
                          setIsCapsLock(true);
                          setIsShiftActive(false);
                        } else {
                          setIsShiftActive(true);
                        }
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      className={`px-6 py-5 rounded-lg font-medium text-2xl lg:text-3xl transition-all duration-150 select-none font-sans min-w-16 lg:min-w-20 ${
                        isUppercase
                          ? "bg-tertiary hover:bg-tertiary/80 text-white"
                          : "bg-white hover:bg-tertiary/20 text-secondary border border-secondary/30"
                      }`}
                      aria-label={isCapsLock ? "Caps Lock" : "Shift"}
                    >
                      {isCapsLock ? "⇪" : "⇧"}
                    </button>
                  );
                }
                if (key === "DELETE") {
                  return (
                    <button
                      key={`${rowIndex}-${keyIndex}-${key}`}
                      type="button"
                      onClick={handleBackspaceClick}
                      onMouseDown={(e) => e.preventDefault()}
                      className="px-6 py-5 bg-white hover:bg-tertiary/20 active:bg-tertiary text-secondary rounded-lg font-medium text-2xl lg:text-3xl transition-all duration-150 select-none font-sans border border-secondary/30 min-w-16 lg:min-w-20"
                      aria-label="Backspace"
                    >
                      ⌫
                    </button>
                  );
                }
                return (
                  <button
                    key={`${rowIndex}-${keyIndex}-${key}`}
                    type="button"
                    onClick={() => handleKeyClick(key)}
                    onMouseDown={(e) => e.preventDefault()}
                    className="px-6 py-5 bg-white hover:bg-tertiary/20 active:bg-tertiary text-secondary rounded-lg font-medium text-3xl lg:text-4xl transition-all duration-150 select-none font-sans border border-secondary/30 min-w-16 lg:min-w-20"
                    aria-label={`Key ${key}`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="flex gap-3 justify-center mt-2">
            <button
              type="button"
              onClick={() => handleKeyClick(" ")}
              onMouseDown={(e) => e.preventDefault()}
              className="px-10 py-5 bg-white hover:bg-tertiary/20 active:bg-tertiary text-secondary rounded-lg font-medium text-2xl lg:text-3xl transition-all duration-150 select-none font-sans border border-secondary/30 flex-1 max-w-xs"
              aria-label="Space"
            >
              Space
            </button>
            <button
              type="button"
              onClick={handleEnterClick}
              onMouseDown={(e) => e.preventDefault()}
              className="px-10 py-5 bg-white hover:bg-tertiary/20 active:bg-tertiary text-secondary rounded-lg font-medium text-2xl lg:text-3xl transition-all duration-150 select-none font-sans border border-secondary/30"
              aria-label="Enter"
            >
              ↵
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
