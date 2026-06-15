'use client';

import React from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string | number }>({ columns, data, onRowClick }: DataTableProps<T>) {
  return (
    <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-text-secondary uppercase bg-bg-main border-b border-border">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 font-medium">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-text-secondary">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr 
                  key={row.id} 
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-border last:border-0 hover:bg-bg-main transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-text-primary">
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Stub */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-bg-card">
        <span className="text-sm text-text-secondary">
          Hiển thị 1 đến {Math.min(data.length, 10)} trong {data.length} kết quả
        </span>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm border border-border rounded text-text-secondary hover:bg-bg-main disabled:opacity-50">
            Trước
          </button>
          <button className="px-3 py-1 text-sm border border-border rounded text-text-secondary hover:bg-bg-main disabled:opacity-50">
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
