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
import jsPDF from "jspdf";
import "jspdf-autotable";
import FiltroSection from "../components/FiltroSection";
import ResumoCard from "../components/ResumoCard";
import { incomeCategories, expenseCategories } from "../utils/categories";

const COLORS = ["#22c55e", "#ef4444"];

export default function Dashboard() {
  const [user] = useAuthState(auth);
  const [transactions, setTransactions] = useState([]);
  const [userName, setUserName] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterCategory, setFilterCategory] = useState("todas");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [dateError, setDateError] = useState("");

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

  useEffect(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError("Data inicial não pode ser maior que a final.");
    } else {
      setDateError("");
    }
  }, [startDate, endDate]);

  const filteredTransactions = transactions.filter((t) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(new Date(endDate).getTime() + 86399999) : null;

    const periodMatch = (!start || t.createdAt >= start) && (!end || t.createdAt <= end);
    const typeMatch = filterType === "todos" || t.type === filterType;
    const categoryMatch = filterCategory === "todas" || t.category === filterCategory;

    return periodMatch && typeMatch && categoryMatch;
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

  const groupedByMonth = () => {
    const grouped = {};
    filteredTransactions.forEach((t) => {
      const month = t.createdAt.toLocaleString("pt-BR", { month: "short", year: "numeric" });
      if (!grouped[month]) grouped[month] = { month, ganhos: 0, gastos: 0 };
      if (t.type === "ganho") grouped[month].ganhos += t.amount;
      if (t.type === "gasto") grouped[month].gastos += t.amount;
    });
    return Object.values(grouped).sort((a, b) => new Date("01 " + a.month) - new Date("01 " + b.month));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Transações", 14, 22);
    doc.setFontSize(12);
    doc.text(`Ganhos: R$ ${totalGanhos.toFixed(2)}`, 14, 32);
    doc.text(`Gastos: R$ ${totalGastos.toFixed(2)}`, 14, 39);
    doc.text(`Saldo: R$ ${balance.toFixed(2)}`, 14, 46);

    const ganhos = filteredTransactions.filter((t) => t.type === "ganho");
    const gastos = filteredTransactions.filter((t) => t.type === "gasto");

    const formatTable = (title, data, startY) => {
      doc.setFontSize(14);
      doc.text(title, 14, startY);
      const rows = data.map((t) => [t.category || "-", t.amount.toFixed(2), t.createdAt.toLocaleDateString("pt-BR")]);
      doc.autoTable({
        head: [["Categoria", "Valor (R$)", "Data"]],
        body: rows,
        startY: startY + 4,
        styles: { fontSize: 10 },
      });
      return doc.lastAutoTable.finalY + 6;
    };

    let y = 54;
    if (ganhos.length > 0) y = formatTable("Ganhos", ganhos, y);
    if (gastos.length > 0) formatTable("Gastos", gastos, y);

    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    doc.save(`transacoes_${dateStr}.pdf`);
  };

  const availableCategories =
    filterType === "ganho"
      ? incomeCategories
      : filterType === "gasto"
      ? expenseCategories
      : [...new Set(transactions.map((t) => t.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6 text-gray-900 dark:text-gray-100 transition-colors">
      <header className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">Bem-vindo, {userName}</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
          <DarkModeToggle />
          <button
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <FiltroSection
        filterType={filterType}
        setFilterType={setFilterType}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onClearFilters={() => {
          setStartDate("");
          setEndDate("");
          setFilterType("todos");
          setFilterCategory("todas");
        }}
        onExportPDF={exportToPDF}
        onNovaTransacao={() => {
          setEditingTransaction(null);
          setModalOpen(true);
        }}
        dateError={dateError}
        availableCategories={availableCategories}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
      >
        <ResumoCard label="Ganhos" value={totalGanhos} color="text-green-500" />
        <ResumoCard label="Gastos" value={totalGastos} color="text-red-500" />
        <ResumoCard label="Saldo" value={balance} color={balance >= 0 ? "text-green-600" : "text-red-600"} />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg md:col-span-2">
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
      </div>

      <div className="mt-6">
        <TransactionList transactions={filteredTransactions} onEdit={(t) => { setEditingTransaction(t); setModalOpen(true); }} />
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editingTransaction}
      />
    </div>
  );
}
