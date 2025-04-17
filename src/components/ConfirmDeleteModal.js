// components/ConfirmDeleteModal.js
import { Dialog } from "@headlessui/react";
import { X } from "lucide-react";

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow max-w-sm w-full space-y-4">
          <div className="flex justify-between items-center">
            <Dialog.Title className="text-lg font-semibold dark:text-white">
              Confirmar Exclusão
            </Dialog.Title>
            <button onClick={onClose} aria-label="Fechar modal">
              <X className="text-gray-500 hover:text-black dark:hover:text-white" />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300">
            Tem certeza que deseja excluir esta transação? Essa ação não pode ser desfeita.
          </p>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded text-gray-600 hover:underline"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
            >
              Excluir
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
