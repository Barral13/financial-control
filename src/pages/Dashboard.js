// imports
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import TransactionList from "../components/TransactionList";
import DarkModeToggle from "../components/DarkModeToggle";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
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

// cores do gráfico
const COLORS = ["#22c55e", "#ef4444"];

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [dateError, setDateError] = useState("");

  // Fetch usuário + transações
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

  // Validação de data
  useEffect(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError("Data inicial não pode ser maior que a final.");
    } else {
      setDateError("");
    }
  }, [startDate, endDate]);

  // Exportação para CSV
  const exportToCSV = () => {
    const rows = filteredTransactions.map((t) => ({
      Tipo: t.type,
      Categoria: t.category || "-",
      Valor: t.amount.toFixed(2),
      Data: t.createdAt.toLocaleDateString("pt-BR"),
    }));

    const csv = [
      ["Tipo", "Categoria", "Valor", "Data"],
      ...rows.map((r) => [r.Tipo, r.Categoria, r.Valor, r.Data]),
    ]
      .map((row) => row.join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "transacoes.csv");
    link.click();
  };

  // Filtro
  const filteredTransactions = transactions.filter((t) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate
      ? new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000 - 1)
      : null;

    const periodMatch =
      (!start || t.createdAt >= start) && (!end || t.createdAt <= end);

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

  // Agrupamento mensal
  const groupedByMonth = () => {
    const grouped = {};

    filteredTransactions.forEach((t) => {
      const month = t.createdAt.toLocaleString("pt-BR", {
        month: "short",
        year: "numeric",
      });

      if (!grouped[month]) grouped[month] = { month, ganhos: 0, gastos: 0 };

      if (t.type === "ganho") grouped[month].ganhos += t.amount;
      if (t.type === "gasto") grouped[month].gastos += t.amount;
    });

    return Object.values(grouped).sort((a, b) => {
      return new Date("01 " + a.month) - new Date("01 " + b.month);
    });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingTransaction(null);
    setModalOpen(true);
  };

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setFilterType("todos");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Bem-vindo, {userName}</h1>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4 mb-2 items-end">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        >
          <option value="todos">Todos</option>
          <option value="ganho">Ganhos</option>
          <option value="gasto">Gastos</option>
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border p-2 rounded bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        />

        <button
          onClick={handleClearFilters}
          className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-100 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Limpar Filtros
        </button>

        <button
          onClick={exportToCSV}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Exportar CSV
        </button>

        <button
          onClick={handleNew}
          className="ml-auto bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Nova Transação
        </button>
      </div>

      {dateError && (
        <p className="text-red-600 text-sm mt-1 mb-4">{dateError}</p>
      )}

      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
        Total de transações no período:{" "}
        <strong>{filteredTransactions.length}</strong>
      </p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg col-span-1 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Resumo Financeiro</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ganhos</p>
              <p className="text-xl font-bold text-green-500">
                R$ {totalGanhos.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gastos</p>
              <p className="text-xl font-bold text-red-500">
                R$ {totalGastos.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
              <p
                className={`text-xl font-bold ${balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                R$ {balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
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

      {/* Gráfico de Barras */}
      <div className="mt-6 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Evolução por Mês</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={groupedByMonth()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip />
            <Bar dataKey="ganhos" fill="#22c55e" name="Ganhos" />
            <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

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
