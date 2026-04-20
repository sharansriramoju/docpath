import type { ReactNode } from "react";
import "./Table.css";

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  width?: string;
  render?: (value: unknown, row: T) => ReactNode;
}

interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  renderActions?: (row: T) => ReactNode;
  emptyMessage?: string;
}

const Table = <T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  renderActions,
  emptyMessage = "No data found",
}: TableProps<T>) => (
  <div className="table-wrapper">
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              style={col.width ? { width: col.width } : undefined}
            >
              {col.label}
            </th>
          ))}
          {renderActions && <th style={{ width: "100px" }}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length + (renderActions ? 1 : 0)}
              style={{
                textAlign: "center",
                padding: "2rem",
                color: "var(--text-muted)",
              }}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row, idx) => (
            <tr
              key={
                ((row as Record<string, unknown>).id as string | number) ?? idx
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={onRowClick ? { cursor: "pointer" } : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(row[col.key], row)
                    : (row[col.key] as React.ReactNode)}
                </td>
              ))}
              {renderActions && (
                <td>
                  <div className="table-actions">{renderActions(row)}</div>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default Table;
