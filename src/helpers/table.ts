import type { TableUserConfig } from 'table'

/**
 * @description Returns a strongly typed configuration object for the 'table' package.
 * @param {TableUserConfig['columns']} columns - The columns configuration for the table.
 * @returns {TableUserConfig} The strongly typed table configuration object.
 */
const configTable = (columns: TableUserConfig['columns']): TableUserConfig => {
  const config: TableUserConfig = {
    drawHorizontalLine: (lineIndex: number, rowCount: number): boolean => {
      return lineIndex === 0 || lineIndex === 1 || lineIndex === rowCount
    },
    border: {
      topBody: `─`,
      topJoin: `┬`,
      topLeft: `┌`,
      topRight: `┐`,

      bottomBody: `─`,
      bottomJoin: `┴`,
      bottomLeft: `└`,
      bottomRight: `┘`,

      bodyLeft: `│`,
      bodyRight: `│`,
      bodyJoin: `│`,

      joinBody: `─`,
      joinLeft: `├`,
      joinRight: `┤`,
      joinJoin: `┼`
    },
    columns
  }
  return config
}

export { configTable }
