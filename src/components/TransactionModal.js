import { Dialog } from "@headlessui/react";
import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { addDoc, updateDoc, doc, collection, serverTimestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-hot-toast";
import { X } from "lucide-react";

const incomeCategories = ["Salário", "Investimentos", "Doações", "Outros"];
const expenseCategories = ["Alimentação", "Transporte", "Lazer", "Educação", "Saúde", "Moradia", "Impostos", "Outros"];

export default function TransactionModal({ isOpen, onClose, transaction }) {
  const [type, setType] = useState("ganho");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [user] = useAuthState(auth);

  // Função para limpar o formulário
  const resetForm = () => {
    setType("ganho");
    setAmount("");
    setCategory("");
  };

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
    } else {
      resetForm();
    }
  }, [transaction]);

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    if (!user) return toast.error("Você precisa estar logado.", { id: "auth-error" });
    if (!amount || !category) return toast.error("Preencha todos os campos.", { id: "field-error" });

    try {
      if (transaction) {
        await updateDoc(doc(db, "transactions", transaction.id), {
          type,
          amount: parseFloat(amount),
          category,
        });
        toast.success("Transação atualizada!", { id: "modal-update" });
      } else {
        await addDoc(collection(db, "transactions"), {
          type,
          amount: parseFloat(amount),
          category,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        toast.success("Transação adicionada!", { id: "modal-create" });
      }
      handleClose();
    } catch (err) {
      toast.error("Erro ao salvar: " + err.message, { id: "modal-error" });
    }
  };

  const categories = type === "ganho" ? incomeCategories : expenseCategories;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50" role="dialog">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow max-w-md w-full space-y-4">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-lg font-semibold dark:text-white">
              {transaction ? "Editar Transação" : "Nova Transação"}
            </Dialog.Title>
            <button onClick={handleClose} aria-label="Fechar modal">
              <X className="text-gray-500 hover:text-black dark:hover:text-white" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="ganho">Ganho</option>
              <option value="gasto">Gasto</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
            >
              <option value="">Selecione</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Valor"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border p-2 rounded dark:bg-gray-700 dark:text-white"
              required
            />

            <button className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
              {transaction ? "Atualizar" : "Adicionar"}
            </button>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
