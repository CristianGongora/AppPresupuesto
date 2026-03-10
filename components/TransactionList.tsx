'use client'

export default function TransactionList({
  transactions,
  onDeleteTransaction,
}: {
  transactions: any[]
  onDeleteTransaction: (id: string) => Promise<void>
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta transacción?')) {
      setLoading(id)
      try {
        await onDeleteTransaction(id)
      } finally {
        setLoading(null)
      }
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Transacciones</h2>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No hay transacciones aún</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Fecha
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Descripción
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Categoría
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                  Monto
                </th>
                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.description}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {transaction.category}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm font-semibold ${
                      transaction.type === 'income'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDelete(transaction.id)}
                      disabled={loading === transaction.id}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 transition"
                    >
                      {loading === transaction.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
