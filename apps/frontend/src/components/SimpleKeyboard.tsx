import React, { useEffect, useRef } from "react";
import Keyboard from "simple-keyboard";
// @ts-expect-error - CSS import lacks TypeScript definitions
import "simple-keyboard/build/css/index.css";

interface SimpleKeyboardProps {
  onKeyPress: (button: string) => void;
  inputName?: string;
  layoutName?: string;
}

export default function SimpleKeyboard({
  onKeyPress,
  inputName = "default",
  layoutName = "default",
}: SimpleKeyboardProps) {
  const keyboardRef = useRef<Keyboard | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onKeyPressRef = useRef(onKeyPress);

  // Update the ref when onKeyPress changes
  useEffect(() => {
    onKeyPressRef.current = onKeyPress;
  }, [onKeyPress]);

  useEffect(() => {
    if (!keyboardRef.current && containerRef.current) {
      keyboardRef.current = new Keyboard(".simple-keyboard", {
        onKeyPress: (button) => {
          // Call the parent's onKeyPress handler via ref
          onKeyPressRef.current(button);
        },
        theme: "hg-theme-default hg-layout-default",
        layout: {
          default: [
            "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
            "{tab} q w e r t y u i o p [ ] \\",
            "{lock} a s d f g h j k l ; ' {enter}",
            "{shift} z x c v b n m , . / {shift}",
            ".com @ {space}",
          ],
          shift: [
            "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
            "{tab} Q W E R T Y U I O P { } |",
            '{lock} A S D F G H J K L : " {enter}',
            "{shift} Z X C V B N M < > ? {shift}",
            ".com @ {space}",
          ],
        },
        display: {
          "{bksp}": "⌫",
          "{enter}": "↵",
          "{shift}": "⇧",
          "{tab}": "⇥",
          "{lock}": "⇪",
          "{space}": "Space",
        },
        preventMouseDownDefault: true,
      });
    }

    return () => {
      if (keyboardRef.current) {
        keyboardRef.current.destroy();
        keyboardRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (keyboardRef.current) {
      keyboardRef.current.setOptions({
        layoutName: layoutName,
        inputName: inputName,
      });
    }
  }, [layoutName, inputName]);

  return (
    <>
      <style>{`
        .simple-keyboard .hg-button {
          height: 80px !important;
          font-size: 28px !important;
          font-weight: 500 !important;
          min-width: 50px !important;
        }
        .simple-keyboard .hg-row {
          margin-bottom: 8px !important;
        }
      `}</style>
      <div
        ref={containerRef}
        className="fixed bottom-52 left-0 right-0 z-50 bg-white/50 shadow-2xl p-4 px-20"
        onMouseDown={(e) => {
          // Prevent the input from losing focus when clicking on the keyboard
          e.preventDefault();
        }}
      >
        <div className="simple-keyboard" />
      </div>
    </>
  );
}
