import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
  } from "recharts";
  
  export default function BarChartMonthly({ transactions }) {
    const grouped = {};
  
    transactions.forEach((t) => {
      const month = t.createdAt.toLocaleString("pt-BR", {
        month: "short",
        year: "numeric",
      });
  
      if (!grouped[month]) grouped[month] = { month, ganhos: 0, gastos: 0 };
  
      if (t.type === "ganho") grouped[month].ganhos += t.amount;
      if (t.type === "gasto") grouped[month].gastos += t.amount;
    });
  
    const data = Object.values(grouped).sort((a, b) => {
      return new Date("01 " + a.month) - new Date("01 " + b.month);
    });
  
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="ganhos" fill="#22c55e" name="Ganhos" />
          <Bar dataKey="gastos" fill="#ef4444" name="Gastos" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  