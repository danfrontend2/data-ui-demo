import { Action } from '../types/actions';

export function getActionMessage(action: Action): string {
  const details = action.details;
  
  switch (action.type) {
    case 'START':
      return 'Starting macro execution...';
    case 'ADD_GRID':
      return 'Adding a new data grid';
    case 'REMOVE_GRID':
      return 'Removing item';
    case 'REMOVE_ALL_GRIDS':
      return 'Clearing all panels...';
    case 'UPDATE_LAYOUT':
      if (details.layout && details.layout.length > 0) {
        const lastItem = details.layout[details.layout.length - 1];
        return `Adjusting layout, height: ${lastItem.h}, width: ${lastItem.w}`;
      }
      return 'Updating layout arrangement...';
    case 'DROP_FILE':
      if (details.excelData && details.excelData.length > 0) {
        return `Loading data from file, ${details.excelData.length} rows, fields: ${details.excelData[0]}`;
      }
      return 'Loading data into grid...';
    case 'SELECT_RANGE':
      if (details.range) {
        return `Selecting data range, lines:${details.range.startRow} - ${details.range.endRow}`;
      }
      return 'Selecting data range...';
    case 'ADD_CHART':
      if (details.item && details.item.chartData) {
        const chartType = details.item.type;
        const categories = details.item.chartData.map((obj: any) => obj.category).join(", ");
        switch (chartType) {
          case 'pie-chart':
            return `Adding a pie chart, for categories:[${categories}]`;
          case 'line-chart':
            return `Adding a line chart, for categories:[${categories}]`;
          case 'bar-chart':
            return `Adding a bar chart, for categories:[${categories}]`;
          default:
            return 'Adding a new chart';
        }
      }
      return 'Creating chart visualization...';
    case 'ARRANGE':
      if (details.columns) {
        return `Arranging items in ${details.columns} columns`;
      }
      return 'Arranging panels...';
    case 'UPDATE_CHART_OPACITY':
      if (details.opacity !== undefined) {
        const targetText = details.chartId ? `chart ${details.chartId}` : 'all charts';
        return `Updating opacity to ${details.opacity} for ${targetText}`;
      }
      return 'Updating chart opacity...';
    case 'UPDATE_CHART_STROKE_WIDTH':
      if (details.strokeWidth !== undefined) {
        const targetText = details.chartId ? `chart ${details.chartId}` : 'all charts';
        return `Updating stroke width to ${details.strokeWidth} for ${targetText}`;
      }
      return 'Updating chart stroke width...';
    case 'UPDATE_CHART_COLOR_SET':
      if (details.colorSet) {
        const targetText = details.chartId ? `chart ${details.chartId}` : 'all charts';
        return `Changing color scheme to ${details.colorSet} for ${targetText}`;
      }
      return 'Updating chart colors...';
    case 'OPEN_AI_CHAT':
      if (details.message) {
        return `Opening AI chat with message: "${details.message}"`;
      }
      return 'Opening AI chat...';
    default:
      return `Executing ${action.type}...`;
  }
} 