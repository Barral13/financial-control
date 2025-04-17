// pages/AuthPage.js
import { useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import DarkModeToggle from "../components/DarkModeToggle";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", result.user.uid));
        if (!userDoc.exists()) {
          await signOut(auth);
          throw new Error("Conta inválida. Dados do usuário não encontrados.");
        }
        toast.success("Login realizado com sucesso!");
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        await setDoc(doc(db, "users", result.user.uid), {
          name,
          email,
          createdAt: new Date(),
        });
        toast.success("Conta criada com sucesso!");
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Erro inesperado.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-8 rounded shadow-md w-96 space-y-4">
        <h2 className="text-2xl font-semibold text-center">
          {isLogin ? "Entrar" : "Criar Conta"}
        </h2>

        {!isLogin && (
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
            required
          />
        )}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-700 dark:text-white"
          required
        />

        <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          {isLogin ? "Entrar" : "Cadastrar"}
        </button>

        <p
          onClick={() => setIsLogin(!isLogin)}
          className="text-center text-sm text-blue-600 cursor-pointer"
        >
          {isLogin ? "Criar uma conta" : "Já tenho conta"}
        </p>
      </form>
    </div>
  );
}
