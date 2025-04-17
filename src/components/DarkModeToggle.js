// components/DarkModeToggle.js
import useDarkMode from "../hooks/useDarkMode";

export default function DarkModeToggle() {
  const [enabled, setEnabled] = useDarkMode();

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className="text-sm text-gray-700 dark:text-gray-200 hover:underline"
    >
      {enabled ? "Modo Claro" : "Modo Escuro"}
    </button>
  );
}
