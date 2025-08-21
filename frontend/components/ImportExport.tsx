import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import type { Project, TimeEntry, ImportRow } from '../types';
import { validateTimeEntry } from '../utils/validation';
import { generateUUID } from '../utils/uuid';

interface ImportExportProps {
  projects: Project[];
  selectedProject: Project | null;
  selectedMonth: string;
  timeEntries: TimeEntry[];
  onImport: (entries: Omit<TimeEntry, 'entry_id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
  userEmail: string;
}

export function ImportExport({
  projects,
  selectedProject,
  selectedMonth,
  timeEntries,
  onImport,
  userEmail
}: ImportExportProps) {
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [columnMapping, setColumnMapping] = useState({
    date: 0,
    project: 1,
    task: 2,
    hours: 3
  });
  const [importValidOnly, setImportValidOnly] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        // Skip header row and process data
        const rows = jsonData.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
        
        const importRows: ImportRow[] = rows.map((row, index) => {
          const dateValue = row[columnMapping.date];
          const projectValue = row[columnMapping.project];
          const taskValue = row[columnMapping.task];
          const hoursValue = row[columnMapping.hours];

          // Convert Excel date serial number to date string if needed
          let dateStr = '';
          if (typeof dateValue === 'number' && dateValue > 40000) {
            // Excel date serial number
            const date = new Date((dateValue - 25569) * 86400 * 1000);
            dateStr = date.toISOString().split('T')[0];
          } else if (dateValue) {
            dateStr = new Date(dateValue).toISOString().split('T')[0];
          }

          const importRow: ImportRow = {
            date: dateStr,
            project: String(projectValue || ''),
            task: String(taskValue || ''),
            hours: parseFloat(hoursValue) || 0,
            isValid: false,
            errors: []
          };

          // Validate the row
          const validation = validateTimeEntry({
            date: importRow.date,
            task: importRow.task,
            hours: importRow.hours
          });

          // Check if project exists
          const projectExists = projects.some(p => 
            p.name.toLowerCase() === importRow.project.toLowerCase() ||
            p.project_id.toLowerCase() === importRow.project.toLowerCase()
          );

          if (!projectExists && importRow.project) {
            validation.errors.push(`Project "${importRow.project}" not found`);
            validation.isValid = false;
          }

          importRow.isValid = validation.isValid;
          importRow.errors = validation.errors;

          return importRow;
        });

        setImportData(importRows);
        setShowImportPreview(true);

        toast({
          title: "File Processed",
          description: `Found ${importRows.length} rows. ${importRows.filter(r => r.isValid).length} valid, ${importRows.filter(r => !r.isValid).length} with errors.`,
        });
      } catch (error) {
        console.error('Failed to parse file:', error);
        toast({
          title: "Error",
          description: "Failed to parse the uploaded file. Please check the format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    const rowsToImport = importValidOnly ? importData.filter(r => r.isValid) : importData;
    
    if (rowsToImport.length === 0) {
      toast({
        title: "No Data",
        description: "No valid rows to import.",
        variant: "destructive",
      });
      return;
    }

    try {
      const entries: Omit<TimeEntry, 'entry_id' | 'created_at' | 'updated_at'>[] = rowsToImport.map(row => {
        // Find project by name or ID
        const project = projects.find(p => 
          p.name.toLowerCase() === row.project.toLowerCase() ||
          p.project_id.toLowerCase() === row.project.toLowerCase()
        ) || projects[0]; // Fallback to first project

        return {
          date: row.date,
          project_id: project.project_id,
          task: row.task,
          hours: row.hours,
          user_email: userEmail
        };
      });

      await onImport(entries);
      
      setShowImportPreview(false);
      setImportData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast({
        title: "Import Successful",
        description: `Imported ${entries.length} time entries.`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: "Failed to import time entries. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    if (!selectedProject) {
      toast({
        title: "No Project Selected",
        description: "Please select a project to export.",
        variant: "destructive",
      });
      return;
    }

    // Filter entries for selected project and month
    const filteredEntries = timeEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      const [year, month] = selectedMonth.split('-');
      return entryDate.getFullYear() === parseInt(year) && 
             entryDate.getMonth() === parseInt(month) - 1;
    });

    if (filteredEntries.length === 0) {
      toast({
        title: "No Data",
        description: "No time entries found for the selected project and month.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for export
    const exportData = filteredEntries.map(entry => ({
      Date: entry.date,
      Project: selectedProject.name,
      Task: entry.task,
      Hours: entry.hours
    }));

    // Add total row
    const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
    exportData.push({
      Date: '',
      Project: '',
      Task: 'Total',
      Hours: totalHours
    });

    // Create workbook and export
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Worklog');

    const fileName = `worklog_${selectedProject.name.toLowerCase().replace(/\s+/g, '_')}_${selectedMonth}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredEntries.length} entries to ${fileName}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Import Excel/CSV</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              ref={fileInputRef}
              className="w-64"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Export Current View</Label>
          <Button 
            onClick={handleExport} 
            variant="outline"
            disabled={!selectedProject || timeEntries.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Import Preview */}
      {showImportPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Import Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Column Mapping */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Date Column</Label>
                <Select value={columnMapping.date.toString()} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, date: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <SelectItem key={i} value={i.toString()}>Column {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Project Column</Label>
                <Select value={columnMapping.project.toString()} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, project: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <SelectItem key={i} value={i.toString()}>Column {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Task Column</Label>
                <Select value={columnMapping.task.toString()} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, task: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <SelectItem key={i} value={i.toString()}>Column {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hours Column</Label>
                <Select value={columnMapping.hours.toString()} onValueChange={(v) => setColumnMapping(prev => ({ ...prev, hours: parseInt(v) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <SelectItem key={i} value={i.toString()}>Column {i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Import Options */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="import-valid-only"
                checked={importValidOnly}
                onCheckedChange={(checked) => setImportValidOnly(checked as boolean)}
              />
              <Label htmlFor="import-valid-only">Import valid rows only</Label>
            </div>

            {/* Preview Table */}
            <div className="max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.slice(0, 10).map((row, index) => (
                    <TableRow key={index} className={row.isValid ? '' : 'bg-red-50'}>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.project}</TableCell>
                      <TableCell>{row.task}</TableCell>
                      <TableCell>{row.hours}</TableCell>
                      <TableCell className="text-sm text-red-600">
                        {row.errors.join(', ')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importData.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 10 rows of {importData.length} total rows
                </p>
              )}
            </div>

            {/* Import Actions */}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Valid: {importData.filter(r => r.isValid).length} | 
                Errors: {importData.filter(r => !r.isValid).length} | 
                Total: {importData.length}
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowImportPreview(false)}>
                  Cancel
                </Button>
                <Button onClick={handleImport}>
                  Import {importValidOnly ? importData.filter(r => r.isValid).length : importData.length} Rows
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
