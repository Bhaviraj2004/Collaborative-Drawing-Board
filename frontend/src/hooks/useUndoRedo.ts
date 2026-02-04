import { useState, useCallback } from 'react';

interface UseUndoRedoReturn<T> {
  state: T[];
  setState: (newState: T[]) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  push: (item: T) => void;
  clear: () => void;
}

export function useUndoRedo<T>(initialState: T[] = []): UseUndoRedoReturn<T> {
  const [states, setStates] = useState<T[][]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentState = states[currentIndex];

  const setState = useCallback((newState: T[]) => {
    setStates((prev) => {
      const newStates = prev.slice(0, currentIndex + 1);
      newStates.push(newState);
      return newStates;
    });
    setCurrentIndex((prev) => prev + 1);
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const redo = useCallback(() => {
    if (currentIndex < states.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, states.length]);

  const push = useCallback((item: T) => {
    setState([...currentState, item]);
  }, [currentState, setState]);

  const clear = useCallback(() => {
    setState([]);
  }, [setState]);

  return {
    state: currentState,
    setState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < states.length - 1,
    push,
    clear,
  };
}