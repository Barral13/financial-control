export default function ResumoCard({ label, value, color }) {
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow text-center">
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>R$ {value.toFixed(2)}</p>
        </div>
    );
}
