import React, { useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Box, Button } from '@mui/material';
import * as XLSX from 'xlsx';

// Pequeno wrapper para transformar {field, headerName, flex, minWidth, editable}
// do MUI DataGrid em columnDefs do AG Grid e habilitar recursos "Excel-like".
export default function ExcelGrid({ rows, columns, onRowsChange, showToolbar = true }) {
  const gridApiRef = useRef(null);
  const colApiRef = useRef(null);
  const { columnDefs, frameworkComponents } = useMemo(() => {
    const frameworkComponents = {};
    const defs = (columns || []).map((c, idx) => {
      const def = {
        field: c.field,
        headerName: c.headerName || c.field,
        editable: c.editable !== false,
        flex: c.flex,
        width: c.width,
        minWidth: c.minWidth || 120,
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: c.valueFormatter,
        cellRendererParams: c.cellRendererParams,
        cellStyle: c.cellStyle,
        tooltipValueGetter: c.tooltipValueGetter,
        wrapText: c.wrapText,
        autoHeight: c.autoHeight,
      };
      // Se cellRenderer for um componente React (função), registra como frameworkComponent
      if (typeof c.cellRenderer === 'function') {
        const key = `cr_${c.field || idx}`;
        frameworkComponents[key] = c.cellRenderer;
        def.cellRenderer = key;
      } else if (typeof c.cellRenderer === 'string') {
        def.cellRenderer = c.cellRenderer;
      }
      return def;
    });
    return { columnDefs: defs, frameworkComponents };
  }, [columns]);

  const defaultColDef = useMemo(
    () => ({
      editable: true,
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  const onCellValueChanged = (params) => {
    if (!onRowsChange) return;
    const data = params.api.getDisplayedRowAtIndex(params.rowIndex)?.data;
    if (!data) return;
    // Reconstrói a lista de linhas a partir do grid
    const updated = [];
    params.api.forEachNode((node) => {
      if (node.data) updated.push(node.data);
    });
    onRowsChange(updated);
  };

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    colApiRef.current = params.columnApi;
  };

  const handleExportCsv = () => {
    gridApiRef.current?.exportDataAsCsv({ suppressQuotes: true });
  };

  const handleAutoSize = () => {
    const allCols = colApiRef.current?.getAllColumns() || [];
    colApiRef.current?.autoSizeColumns(allCols.map((c) => c.getColId()));
  };

  const handleExportXlsx = () => {
    const data = [];
    gridApiRef.current?.forEachNodeAfterFilterAndSort((node) => {
      if (node.data) data.push(node.data);
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, 'dados.xlsx');
  };

  return (
    <div className="ag-theme-alpine" style={{ width: '100%' }}>
      {showToolbar && (
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Button size="small" variant="outlined" onClick={handleExportCsv}>
            Exportar CSV
          </Button>
          <Button size="small" variant="outlined" onClick={handleExportXlsx}>
            Exportar Excel
          </Button>
          <Button size="small" variant="outlined" onClick={handleAutoSize}>
            Auto tamanho
          </Button>
        </Box>
      )}
      <AgGridReact
        rowData={rows}
        columnDefs={columnDefs}
        frameworkComponents={frameworkComponents}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        suppressRowClickSelection={true}
        animateRows={true}
        enableRangeSelection={true}
        domLayout="autoHeight"
        enableCellTextSelection={true}
        clipboardDelimiter="," // permite copiar e colar CSV
        onCellValueChanged={onCellValueChanged}
        onGridReady={onGridReady}
      />
    </div>
  );
}
