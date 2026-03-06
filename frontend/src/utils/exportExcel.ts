import * as XLSX from 'xlsx'

export interface ExportColumn<T> {
  header: string
  accessor: keyof T | ((row: T) => string | number | null | undefined)
}

export function exportToExcel<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  const headers = columns.map((col) => col.header)

  const rows = data.map((row) =>
    columns.map((col) => {
      if (typeof col.accessor === 'function') {
        return col.accessor(row) ?? ''
      }
      const value = row[col.accessor]
      return value !== null && value !== undefined ? value : ''
    })
  )

  const worksheetData = [headers, ...rows]
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)

  // Auto-ajustar ancho de columnas
  const colWidths = headers.map((header, i) => {
    const maxLength = Math.max(
      header.length,
      ...rows.map((row) => String(row[i]).length)
    )
    return { wch: Math.min(maxLength + 2, 50) }
  })
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte')

  // Generar nombre de archivo con fecha
  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${filename}_${date}.xlsx`)
}

export function exportMultipleSheetsToExcel(
  sheets: Array<{
    name: string
    data: unknown[][]
  }>,
  filename: string
) {
  const workbook = XLSX.utils.book_new()

  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })

  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(workbook, `${filename}_${date}.xlsx`)
}
