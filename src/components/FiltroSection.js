export default function FiltroSection({
  filterType,
  setFilterType,
  filterCategory,
  setFilterCategory,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClearFilters,
  onExportPDF,
  onNovaTransacao,
  dateError,
  availableCategories = [],
}) {
  return (
    <section className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-4 w-full sm:flex-row sm:items-end sm:gap-6">
          <div className="grid grid-cols-2 gap-4 sm:flex sm:gap-4 w-full">
            {/* Datas */}
            <div className="flex flex-col">
              <label className="text-sm mb-1">Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-2 rounded-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm mb-1">Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-2 rounded-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Tipo */}
          <div className="flex flex-col w-full sm:w-40">
            <label className="text-sm mb-1">Tipo</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="p-2 rounded-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="todos">Todos</option>
              <option value="ganho">Ganhos</option>
              <option value="gasto">Gastos</option>
            </select>
          </div>

          {/* Categoria */}
          <div className="flex flex-col w-full sm:w-40">
            <label className="text-sm mb-1">Categoria</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-2 rounded-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="todas">Todas</option>
              {availableCategories.map((cat, i) => (
                <option key={i} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {dateError && <p className="text-red-500 text-sm mt-2">{dateError}</p>}

      <div className="mt-6 flex flex-col sm:flex-row items-center sm:justify-center gap-4">
        <button
          onClick={onClearFilters}
          className="w-full sm:w-auto px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
        >
          Limpar Filtros
        </button>
        <button
          onClick={onExportPDF}
          className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors text-sm"
        >
          Exportar PDF
        </button>
        <button
          onClick={onNovaTransacao}
          className="w-full sm:w-auto px-4 py-2 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors text-sm"
        >
          Nova Transação
        </button>
      </div>
    </section>
  );
}
