"use client";

import React from "react";
import type { Question, ResultCalculator } from "../hooks/useQuiz";
import { useQuiz } from "../hooks/useQuiz";
import { useNavigate } from "react-router-dom";
import { InlineIcon } from "@iconify/react";
import type { Archetype } from "../contexts/PhotoboothContext";
import { usePhotobooth } from "../contexts/PhotoboothContext";
import { getAssetPath } from "../utils/assets";

const questions: Question[] = [
  {
    id: "1",
    type: "multiple",
    question: "Follow Your Scent of Light",
    description:
      "Close your eyes, inhale deeply, and which scent speaks to your soul?<br /><br />Pick one you love most.",
    answers: [
      {
        id: "1",
        text: getAssetPath("/images/scent-1.png"),
        weight: { morning: 1 },
      },
      {
        id: "2",
        text: getAssetPath("/images/scent-2.png"),
        weight: { midday: 1 },
      },
      {
        id: "3",
        text: getAssetPath("/images/scent-3.png"),
        weight: { night: 1 },
      },
    ],
    maxSelections: 1,
  },
  {
    id: "2",
    type: "single",
    question: "Choose your fighter!",
    answers: [
      {
        id: "1",
        text: "“I wake up sparkling.”",
        weight: { morning: 1 },
      },
      {
        id: "2",
        text: "“Don't talk to me before 11.”",
        weight: { night: 1 },
      },
    ],
  },
  {
    id: "3",
    type: "single",
    question: "Who are you at the holiday party?",
    answers: [
      {
        id: "3",
        text: "“I am the party.”",
        weight: { midday: 2 },
      },
      {
        id: "4",
        text: "“I observe and sparkle silently.”",
        weight: { morning: 1, night: 1 },
      },
    ],
  },
  {
    id: "4",
    type: "single",
    question: "What's your holiday tunes?",
    answers: [
      {
        id: "5",
        text: "“Party beats! Give me Daft Punk, Phoenix!”",
        weight: { midday: 1 },
      },
      {
        id: "6",
        text: "“I love my holiday classics. Mariah all the way~”",
        weight: { morning: 1 },
      },
    ],
  },
];

const resultCalculator: ResultCalculator = (answers) => {
  const scores: Record<string, number> = {};

  questions.forEach((question) => {
    const selectedAnswerIds = answers.get(question.id) || [];
    selectedAnswerIds.forEach((answerId) => {
      const answer = question.answers.find((a) => a.id === answerId);
      if (answer?.weight) {
        Object.entries(answer.weight).forEach(([key, value]) => {
          scores[key] = (scores[key] || 0) + value;
        });
      }
    });
  });

  const morning = scores.morning || 0;
  const midday = scores.midday || 0;
  const night = scores.night || 0;

  const maxScore = Math.max(morning, midday, night);
  const hasMultipleMax =
    [morning === maxScore, midday === maxScore, night === maxScore].filter(
      Boolean,
    ).length > 1;

  let archetype: Archetype = "morning";

  if (hasMultipleMax) {
    if (morning === maxScore && midday === maxScore) {
      archetype = "brunch";
    } else if (midday === maxScore && night === maxScore) {
      archetype = "golden";
    } else if (night === maxScore && morning === maxScore) {
      archetype = "chill";
    } else {
      const options = ["brunch", "golden", "chill"] as const;
      const random = Math.floor(Math.random() * options.length);
      archetype = options[random];
    }
  } else {
    if (morning === maxScore) {
      archetype = "morning";
    } else if (midday === maxScore) {
      archetype = "midday";
    } else {
      archetype = "night";
    }
  }

  return archetype;
};

export default function QuizPage() {
  const { setQuizResult } = usePhotobooth();

  const {
    currentQuestion,
    currentQuestionIndex,
    selectedAnswers,
    canProceed,
    selectAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    totalQuestions,
    result,
  } = useQuiz({
    questions,
    resultCalculator,
  });

  const navigate = useNavigate();

  const handleNextQuestion = () => {
    if (!canProceed) {
      return;
    }

    if (currentQuestionIndex === totalQuestions - 1) {
      goToNextQuestion();
      window.setTimeout(() => {
        void navigate("/form");
      }, 0);
    } else {
      goToNextQuestion();
    }
  };

  React.useEffect(() => {
    if (result) {
      try {
        setQuizResult({ archetype: result as Archetype });
      } catch {
        setQuizResult(null);
      }
    }
  }, [result, setQuizResult]);

  return (
    <div
      className="h-svh aspect-9/16 mx-auto bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 bg-primary text-secondary"
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
      {currentQuestion?.type === "multiple" && (
        <div className="w-full px-32 lg:px-40 mx-auto">
          <div className="mb-4 text-center">
            <h1 className="text-6xl lg:text-7xl text-balance mb-8">
              {currentQuestion.question}
            </h1>
            {currentQuestion.description && (
              <p
                className="text-2xl text-balance"
                dangerouslySetInnerHTML={{
                  __html: currentQuestion.description,
                }}
              />
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-8 my-8 sm:mt-12">
            {currentQuestion.answers.map((answer) => {
              const isSelected = selectedAnswers.includes(answer.id);
              return (
                <button
                  key={answer.id}
                  className={`relative cursor-pointer transition-all duration-200  rounded-lg ${
                    isSelected
                      ? "ring-8 ring-tertiary brightness-100"
                      : "hover:brightness-100 brightness-75"
                  }`}
                  onClick={() => selectAnswer(answer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectAnswer(answer.id);
                    }
                  }}
                  aria-label={`Select ${answer.text}`}
                >
                  <img
                    src={answer.text}
                    alt={answer.text}
                    className="w-full h-auto max-w-xs sm:max-w-md object-contain rounded-lg"
                  />
                </button>
              );
            })}
          </div>

          <div className="flex justify-center mt-16">
            <button
              className="px-10 py-5 bg-secondary hover:bg-tertiary text-white rounded-lg font-medium text-3xl lg:text-5xl font-sans transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
              onClick={goToNextQuestion}
              disabled={!canProceed}
            >
              Submit
            </button>
          </div>
        </div>
      )}
      {currentQuestion?.type === "single" && (
        <div className="w-full px-32 lg:px-40 mx-auto">
          <div className="text-center">
            <p className="text-2xl lg:text-3xl text-balance mb-10 font-bold">
              Question {currentQuestionIndex} of {totalQuestions - 1}
            </p>
            <div className="relative w-3/4 h-5 bg-primary border border-tertiary mx-auto rounded-full mt-4 mb-10 flex items-center">
              <div
                className="h-5 bg-tertiary rounded-full transition-all duration-300"
                style={{
                  width: `${(currentQuestionIndex / (totalQuestions - 1)) * 100}%`,
                  minWidth: "1rem",
                }}
              ></div>
            </div>
          </div>
          <div className="mb-4 text-center">
            <h1 className="text-7xl lg:text-8xl text-balance mb-8">
              {currentQuestion.question}
            </h1>
          </div>
          <div className="grid grid-cols-2 justify-center items-center gap-6 sm:gap-8 my-8 sm:mt-12 sm:mb-16">
            {currentQuestion.answers.map((answer) => {
              const isSelected = selectedAnswers.includes(answer.id);
              return (
                <button
                  key={answer.id}
                  className={`h-[366px] relative px-4 bg-white text-secondary font-bold rounded-lg text-4xl lg:text-5xl text-balance transition-all duration-200 cursor-pointer backdrop-blur-lg drop-shadow ${
                    isSelected
                      ? "brightness-100"
                      : "brightness-75 hover:brightness-100"
                  }`}
                  onClick={() => selectAnswer(answer.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectAnswer(answer.id);
                    }
                  }}
                  aria-label={`Select ${answer.text}`}
                >
                  <img
                    src={getAssetPath("/images/bg-card.png")}
                    alt=""
                    className="w-3/4 left-1/2 -z-10 -translate-x-1/2 h-auto object-contain absolute top-0"
                  />
                  {answer.text}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center px-8 font-sans mt-12">
            <button
              className="text-secondary flex items-center gap-2 font-medium text-2xl transition-all duration-200 hover:opacity-70 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none p-4 bg-white/80 rounded-lg"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
              aria-label="Go to previous question"
            >
              <InlineIcon icon="mdi:arrow-left" className="w-6 h-6" /> Back
            </button>
            <button
              className="text-secondary flex items-center gap-2 font-medium text-2xl transition-all duration-200 hover:opacity-70 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed select-none p-4 bg-white/80 rounded-lg"
              onClick={handleNextQuestion}
              disabled={!canProceed}
              aria-label="Go to next question"
            >
              {currentQuestionIndex === totalQuestions - 1 ? "Submit" : "Next"}{" "}
              <InlineIcon icon="mdi:arrow-right" className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
