import { motion, AnimatePresence } from "framer-motion";

function groupByDate(transactions) {
  return transactions.reduce((acc, transaction) => {
    const dateObj = transaction.createdAt?.toDate?.() || new Date();
    const dateStr = dateObj.toLocaleDateString("pt-BR");
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(transaction);
    return acc;
  }, {});
}

export default function TransactionList({ transactions }) {
  const isLoading = transactions === null;

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Transações</h2>
        <p className="text-gray-400 text-sm animate-pulse">Carregando transações...</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Transações</h2>
        <p className="text-gray-500 text-sm flex items-center gap-2">
          📭 Nenhuma transação ainda.
        </p>
      </div>
    );
  }

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
                    <span className={t.type === "ganho" ? "text-green-600" : "text-red-600"}>
                      {t.type === "gasto" && "-"}R$ {t.amount.toFixed(2)}
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
