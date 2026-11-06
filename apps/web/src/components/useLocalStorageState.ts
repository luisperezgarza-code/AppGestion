import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

type Notify = (message: string, type?: "success" | "error") => void;

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  isValid: (value: unknown) => value is T,
  onError: Notify,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) return initialValue;
      const parsedValue: unknown = JSON.parse(storedValue);
      if (!isValid(parsedValue)) {
        throw new Error(`El formato almacenado para "${key}" no es válido.`);
      }
      return parsedValue;
    } catch (error) {
      console.error(`No se pudo leer el almacenamiento "${key}".`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`No se pudo guardar el almacenamiento "${key}".`, error);
      onError("No se pudieron guardar los cambios en este dispositivo.", "error");
    }
  }, [key, onError, value]);

  return [value, setValue];
}
