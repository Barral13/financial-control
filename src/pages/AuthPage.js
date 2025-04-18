// pages/AuthPage.js
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  signOut,
} from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import DarkModeToggle from "../components/DarkModeToggle";
import { Mail, Lock, User } from "lucide-react";

const traduzirErroFirebase = (codigo) => {
  switch (codigo) {
    case "auth/email-already-in-use":
      return "Este e-mail já está em uso. Faça login ou use outro e-mail.";
    case "auth/invalid-email":
      return "E-mail inválido. Verifique e tente novamente.";
    case "auth/user-not-found":
      return "Usuário não encontrado. Verifique seu e-mail ou cadastre-se.";
    case "auth/wrong-password":
      return "Senha incorreta. Tente novamente.";
    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";
    case "auth/network-request-failed":
      return "Erro de conexão. Verifique sua internet.";
    default:
      return "Ocorreu um erro inesperado. Tente novamente.";
  }
};

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetRequest, setIsResetRequest] = useState(false);
  const [isResetConfirm, setIsResetConfirm] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [oobCode, setOobCode] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const code = query.get("oobCode");

    if (location.pathname === "/reset-password" && code) {
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setOobCode(code);
          setEmail(email);
          setIsResetConfirm(true);
        })
        .catch(() => {
          toast.error("Link de redefinição inválido ou expirado.");
        });
    }
  }, [location]);

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
      const mensagemAmigavel = traduzirErroFirebase(err.code);
      toast.error(mensagemAmigavel || err.message);
    }
  };

  const handlePasswordResetRequest = async (e) => {
    e.preventDefault();
    try {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      const actionCodeSettings = {
        url: isLocalhost
          ? "http://localhost:3000/reset-password"
          : "https://financial-control-c38ca.web.app/reset-password",
        handleCodeInApp: true,
      };

      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      toast.success("E-mail de recuperação enviado!");
      setIsResetRequest(false);
    } catch (err) {
      const mensagemAmigavel = traduzirErroFirebase(err.code);
      toast.error(mensagemAmigavel || err.message);
    }
  };

  const handlePasswordResetConfirm = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    try {
      await confirmPasswordReset(auth, oobCode, password);
      toast.success("Senha redefinida com sucesso!");
      // Redireciona para o login interno da AuthPage
      setIsResetConfirm(false);
      setIsLogin(true);
    } catch (err) {
      toast.error("Erro ao redefinir a senha. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:to-gray-800 transition-colors flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>

      <form
        onSubmit={
          isResetConfirm
            ? handlePasswordResetConfirm
            : isResetRequest
            ? handlePasswordResetRequest
            : handleSubmit
        }
        className="w-full max-w-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-8 rounded-2xl shadow-2xl space-y-6 transition-all duration-300"
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          {isResetConfirm
            ? "Definir nova senha"
            : isResetRequest
            ? "Recuperar senha"
            : isLogin
            ? "Bem-vindo de volta"
            : "Crie sua conta"}
        </h2>

        <p className="text-sm text-center text-gray-500 dark:text-gray-400">
          {isResetConfirm
            ? "Digite sua nova senha"
            : isResetRequest
            ? "Informe seu e-mail para redefinir a senha"
            : isLogin
            ? "Faça login para continuar"
            : "Preencha os dados abaixo"}
        </p>

        {!isLogin && !isResetRequest && !isResetConfirm && (
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 p-3 border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        )}

        <div className="relative">
          <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 p-3 border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
            disabled={isResetConfirm}
          />
        </div>

        {(isResetConfirm || !isResetRequest) && (
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 p-3 border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        )}

        {isResetConfirm && (
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 p-3 border rounded-lg bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        )}

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-3 rounded-lg transition-all duration-200">
          {isResetConfirm
            ? "Redefinir senha"
            : isResetRequest
            ? "Enviar e-mail"
            : isLogin
            ? "Entrar"
            : "Cadastrar"}
        </button>

        {!isResetConfirm && isLogin && !isResetRequest && (
          <p
            className="text-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
            onClick={() => setIsResetRequest(true)}
          >
            Esqueceu a senha?
          </p>
        )}

        {!isResetConfirm && (
          <p className="text-center text-sm mt-2">
            {isResetRequest
              ? "Lembrou da senha?"
              : isLogin
              ? "Ainda não tem conta?"
              : "Já tem uma conta?"}{" "}
            <span
              onClick={() => {
                setIsLogin(!isLogin);
                setIsResetRequest(false);
              }}
              className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
            >
              {isResetRequest ? "Voltar ao login" : isLogin ? "Crie agora" : "Entrar"}
            </span>
          </p>
        )}
      </form>
    </div>
  );
}
