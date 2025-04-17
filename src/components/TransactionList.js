import { motion, AnimatePresence } from "framer-motion";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-hot-toast";
import { useState } from "react";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

function groupByDate(transactions) {
  return transactions.reduce((acc, transaction) => {
    const dateObj = transaction.createdAt || new Date();
    const dateStr = dateObj.toLocaleDateString("pt-BR");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(transaction);
    return acc;
  }, {});
}

export default function TransactionList({ transactions, onEdit }) {
  const [deleteId, setDeleteId] = useState(null);

  const handleDelete = async (id) => {
    toast.dismiss(); // Fecha toasts ativos
  
    try {
      await deleteDoc(doc(db, "transactions", id));
      toast.success("Transação excluída.", { id: "delete-success" });
    } catch (err) {
      toast.error("Erro ao excluir: " + err.message, { id: "delete-error" });
    }
  };  

  const grouped = groupByDate(transactions);

  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Transações</h2>
      <ul className="space-y-4">
        {Object.entries(grouped).map(([date, trans]) => (
          <li key={date}>
            <p className="text-gray-600 text-sm font-medium mb-1">{date}</p>
            <ul className="space-y-2">
              <AnimatePresence>
                {trans.map((t) => (
                  <motion.li
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="border-b py-2 flex justify-between text-sm text-gray-700"
                  >
                    <span>{t.category}</span>
                    <span className="flex items-center gap-2">
                      <span
                        className={
                          t.type === "ganho"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {t.type === "gasto" && "-"}R$ {t.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => onEdit(t)}
                        className="bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200 text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200 text-xs"
                      >
                        Excluir
                      </button>
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </li>
        ))}
      </ul>

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          handleDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
