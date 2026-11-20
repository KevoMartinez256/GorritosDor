import ExcelJS from 'exceljs'
import type { Category } from './admin-types'
import { invitationPeople } from './invitation-people'

export async function invitationWorkbook(categories: Category[], year: string) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Gorritos D’or'
  const sheet = workbook.addWorksheet('Invitaciones', {
    views: [{ state: 'frozen', ySplit: 4 }],
  })
  sheet.columns = [{ width: 34 }, { width: 24 }]
  sheet.mergeCells('A1:B1')
  sheet.getCell('A1').value = `Gorritos D’or ${year} · Invitaciones`
  sheet.getCell('A1').font = { name: 'Calibri', size: 17, bold: true, color: { argb: 'FFEED5A0' } }
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12313B' } }
  sheet.getRow(1).height = 34
  sheet.mergeCells('A2:B2')
  sheet.getCell('A2').value = 'Elige Sí o No en la columna de invitación y guarda este archivo.'
  sheet.getCell('A2').alignment = { wrapText: true, vertical: 'middle' }
  sheet.getRow(2).height = 32
  sheet.getRow(4).values = ['Nombre del nominado', '¿Ya fue invitado?']
  sheet.getRow(4).height = 26
  sheet.getRow(4).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12313B' } }
  })
  const people = invitationPeople(categories)
  for (const person of people) {
    const row = sheet.addRow([person.nominee.display_name, 'No'])
    row.height = 24
    row.getCell(2).dataValidation = {
      type: 'list', allowBlank: false, formulae: ['"Sí,No"'],
      showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Elige Sí o No',
      error: 'Selecciona una opción de la lista.',
    }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    row.getCell(2).font = { color: { argb: 'FF1565C0' } }
    row.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: row.number % 2 ? 'FFF0F5F5' : 'FFFFFFFF' } }
    })
  }
  sheet.autoFilter = `A4:B${Math.max(4, sheet.rowCount)}`
  return workbook.xlsx.writeBuffer()
}
