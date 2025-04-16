import { useState } from "react";
import { db, auth } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-hot-toast";

const incomeCategories = ["Salário", "Investimentos", "Doações", "Outros"];
const expenseCategories = ["Alimentação", "Transporte", "Lazer", "Educação", "Saúde", "Moradia", "Impostos", "Outros"];

export default function TransactionForm() {
  const [type, setType] = useState("ganho");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [user, loading] = useAuthState(auth);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error("Você precisa estar logado para adicionar uma transação.");
      return;
    }

    if (!amount || !category) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      await addDoc(collection(db, "transactions"), {
        type,
        amount: parseFloat(amount),
        category,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success("Transação adicionada com sucesso!");
      setAmount("");
      setCategory("");
    } catch (err) {
      toast.error("Erro ao adicionar transação: " + err.message);
    }
  };

  const categories = type === "ganho" ? incomeCategories : expenseCategories;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 space-y-4">
      <div className="flex flex-wrap gap-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border p-2 rounded min-w-[120px]"
        >
          <option value="ganho">Ganho</option>
          <option value="gasto">Gasto</option>
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border p-2 rounded min-w-[150px]"
        >
          <option value="">Selecione</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Valor"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="border p-2 rounded flex-1 min-w-[120px]"
          required
        />

        <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Adicionar
        </button>
      </div>
    </form>
  );
}
