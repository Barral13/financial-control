import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import TransactionList from "../components/TransactionList";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import TransactionModal from "../components/TransactionModal";

const COLORS = ["#22c55e", "#ef4444"];

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserName(data.name || user.email);
      } else {
        setUserName(user.email);
      }
    };

    fetchUserData();

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate?.() || new Date(0),
        };
      });
      setTransactions(data);
    });

    return () => unsub();
  }, [user]);

  const filteredTransactions = transactions.filter((t) => {
    const now = new Date();

    const periodMatch =
      filterPeriod === "" ||
      (filterPeriod === "7d" &&
        now - t.createdAt <= 7 * 24 * 60 * 60 * 1000) ||
      (filterPeriod === "30d" &&
        now - t.createdAt <= 30 * 24 * 60 * 60 * 1000) ||
      (filterPeriod === "2024" && t.createdAt.getFullYear() === 2024);

    const typeMatch = filterType === "todos" || t.type === filterType;

    return periodMatch && typeMatch;
  });

  const totalGanhos = filteredTransactions
    .filter((t) => t.type === "ganho")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalGastos = filteredTransactions
    .filter((t) => t.type === "gasto")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalGanhos - totalGastos;

  const chartData = [
    { name: "Ganhos", value: totalGanhos },
    { name: "Gastos", value: totalGastos },
  ];

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bem-vindo, {userName}
        </h1>
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 text-red-500 hover:text-red-700"
        >
          <LogOut size={20} />
        </button>
      </header>

      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="todos">Todos</option>
          <option value="ganho">Ganhos</option>
          <option value="gasto">Gastos</option>
        </select>
        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="">Todos os períodos</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="2024">Ano 2024</option>
        </select>

        <button
          onClick={handleNew}
          className="ml-auto bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Nova Transação
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white p-6 rounded-2xl shadow-lg col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Ganhos</p>
              <p className="text-xl font-bold text-green-600">
                R$ {totalGanhos.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gastos</p>
              <p className="text-xl font-bold text-red-500">
                R$ {totalGastos.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Saldo</p>
              <p
                className={`text-xl font-bold ${
                  balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                R$ {balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg font-semibold mb-4">Resumo</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="mt-6">
        <TransactionList transactions={filteredTransactions} onEdit={handleEdit} />
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editingTransaction}
      />
    </div>
  );
}
