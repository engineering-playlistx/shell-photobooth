import { useState, useMemo, useCallback } from "react";

export type QuestionType = "single" | "multiple";

export interface Answer {
  id: string;
  text: string;
  weight?: Record<string, number>;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  answers: Answer[];
  maxSelections?: number;
}

export type ResultCalculator = (answers: Map<string, string[]>) => string;

export interface QuizConfig {
  questions: Question[];
  resultCalculator?: ResultCalculator;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Map<string, string[]>;
  isComplete: boolean;
  result?: string;
}

export function useQuiz(config: QuizConfig) {
  const { questions, resultCalculator } = config;

  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: new Map(),
    isComplete: false,
    result: undefined,
  });

  const currentQuestion = useMemo(() => {
    if (state.currentQuestionIndex >= questions.length) {
      return null;
    }
    return questions[state.currentQuestionIndex];
  }, [questions, state.currentQuestionIndex]);

  const selectedAnswers = useMemo(() => {
    if (!currentQuestion) {
      return [];
    }
    return state.answers.get(currentQuestion.id) || [];
  }, [currentQuestion, state.answers]);

  const canProceed = useMemo(() => {
    if (!currentQuestion) {
      return false;
    }
    const selected = selectedAnswers.length;
    if (currentQuestion.type === "single") {
      return selected === 1;
    }
    if (currentQuestion.type === "multiple") {
      const maxSelections = currentQuestion.maxSelections || 2;
      return selected >= 1 && selected <= maxSelections;
    }
    return false;
  }, [currentQuestion, selectedAnswers]);

  const selectAnswer = useCallback(
    (answerId: string) => {
      if (!currentQuestion) {
        return;
      }

      setState((prev) => {
        const currentAnswers = prev.answers.get(currentQuestion.id) || [];
        let newAnswers: string[];

        if (currentQuestion.type === "single") {
          newAnswers = [answerId];
        } else {
          const maxSelections = currentQuestion.maxSelections || 2;
          // If maxSelections is 1, treat it like single selection (auto-switch)
          if (maxSelections === 1) {
            newAnswers = [answerId];
          } else if (currentAnswers.includes(answerId)) {
            newAnswers = currentAnswers.filter((id) => id !== answerId);
          } else {
            if (currentAnswers.length >= maxSelections) {
              newAnswers = currentAnswers;
            } else {
              newAnswers = [...currentAnswers, answerId];
            }
          }
        }

        const updatedAnswers = new Map(prev.answers);
        updatedAnswers.set(currentQuestion.id, newAnswers);

        return {
          ...prev,
          answers: updatedAnswers,
        };
      });
    },
    [currentQuestion],
  );

  const goToNextQuestion = useCallback(() => {
    if (!canProceed) {
      return;
    }

    setState((prev) => {
      const nextIndex = prev.currentQuestionIndex + 1;

      if (nextIndex >= questions.length) {
        const result = resultCalculator
          ? resultCalculator(prev.answers)
          : undefined;

        return {
          ...prev,
          currentQuestionIndex: nextIndex,
          isComplete: true,
          result,
        };
      }

      return {
        ...prev,
        currentQuestionIndex: nextIndex,
      };
    });
  }, [canProceed, questions.length, resultCalculator]);

  const goToPreviousQuestion = useCallback(() => {
    setState((prev) => {
      if (prev.currentQuestionIndex === 0) {
        return prev;
      }

      return {
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
        isComplete: false,
        result: undefined,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      answers: new Map(),
      isComplete: false,
      result: undefined,
    });
  }, []);

  const isAnswerSelected = useCallback(
    (answerId: string) => {
      return selectedAnswers.includes(answerId);
    },
    [selectedAnswers],
  );

  return {
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    totalQuestions: questions.length,
    selectedAnswers,
    isAnswerSelected,
    canProceed,
    isComplete: state.isComplete,
    result: state.result,
    selectAnswer,
    goToNextQuestion,
    goToPreviousQuestion,
    reset,
    answers: state.answers,
  };
}
