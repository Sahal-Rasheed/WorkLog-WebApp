import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { validateTimeEntry } from '../../utils/validation';
import type { TimeEntry, Project } from '../../types';

interface TimeEntriesTableProps {
  timeEntries: TimeEntry[];
  selectedProject: Project;
  selectedMonth: string;
  onAddEntry: (entry: { project_id: string; date: string; task: string; hours: number }) => Promise<void>;
  onUpdateEntry: (entryId: string, updates: { date?: string; task?: string; hours?: number }) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  loading: boolean;
}

interface EditingEntry {
  id: string;
  date: string;
  task: string;
  hours: string;
}

export function TimeEntriesTable({
  timeEntries,
  selectedProject,
  selectedMonth,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading
}: TimeEntriesTableProps) {
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    date: '',
    task: '',
    hours: ''
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Set default date to first day of selected month
  useEffect(() => {
    if (!newEntry.date) {
      const [year, month] = selectedMonth.split('-');
      setNewEntry(prev => ({
        ...prev,
        date: `${year}-${month}-01`
      }));
    }
  }, [selectedMonth, newEntry.date]);

  const handleAddNew = () => {
    setIsAddingNew(true);
    setTimeout(() => taskInputRef.current?.focus(), 0);
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewEntry({ date: '', task: '', hours: '' });
  };

  const handleSaveNew = async () => {
    const validation = validateTimeEntry({
      date: newEntry.date,
      task: newEntry.task,
      hours: parseFloat(newEntry.hours) || 0
    });

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    try {
      await onAddEntry({
        project_id: selectedProject.id,
        date: newEntry.date,
        task: newEntry.task,
        hours: parseFloat(newEntry.hours)
      });

      setNewEntry({ date: '', task: '', hours: '' });
      setIsAddingNew(false);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry({
      id: entry.id,
      date: entry.date,
      task: entry.task,
      hours: entry.hours.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const validation = validateTimeEntry({
      date: editingEntry.date,
      task: editingEntry.task,
      hours: parseFloat(editingEntry.hours) || 0
    });

    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    try {
      await onUpdateEntry(editingEntry.id, {
        date: editingEntry.date,
        task: editingEntry.task,
        hours: parseFloat(editingEntry.hours)
      });

      setEditingEntry(null);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      await onDeleteEntry(entryId);
    } catch (error) {
      // Error handling is done in parent component
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isAddingNew) {
        handleCancelAdd();
      } else if (editingEntry) {
        handleCancelEdit();
      }
    }
  };

  const sortedEntries = [...timeEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* Add New Entry Row */}
      <div className="border-b pb-4 px-6">
        {!isAddingNew ? (
          <Button onClick={handleAddNew} className="w-full" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Time Entry
          </Button>
        ) : (
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-3">
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, handleSaveNew)}
              />
            </div>
            <div className="col-span-5">
              <Input
                ref={taskInputRef}
                placeholder="Task description"
                value={newEntry.task}
                onChange={(e) => setNewEntry(prev => ({ ...prev, task: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, handleSaveNew)}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                step="0.25"
                min="0"
                max="24"
                placeholder="Hours"
                value={newEntry.hours}
                onChange={(e) => setNewEntry(prev => ({ ...prev, hours: e.target.value }))}
                onKeyDown={(e) => handleKeyDown(e, handleSaveNew)}
              />
            </div>
            <div className="col-span-2 flex space-x-1">
              <Button size="sm" onClick={handleSaveNew} disabled={loading}>
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelAdd}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                  No time entries for this month. Add your first entry above.
                </TableCell>
              </TableRow>
            ) : (
              sortedEntries.map((entry) => (
                <TableRow key={entry.id}>
                  {editingEntry?.id === entry.id ? (
                    <>
                      <TableCell>
                        <Input
                          type="date"
                          value={editingEntry.date}
                          onChange={(e) => setEditingEntry(prev => prev ? { ...prev, date: e.target.value } : null)}
                          onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editingEntry.task}
                          onChange={(e) => setEditingEntry(prev => prev ? { ...prev, task: e.target.value } : null)}
                          onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.25"
                          min="0"
                          max="24"
                          value={editingEntry.hours}
                          onChange={(e) => setEditingEntry(prev => prev ? { ...prev, hours: e.target.value } : null)}
                          onKeyDown={(e) => handleKeyDown(e, handleSaveEdit)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.task}</TableCell>
                      <TableCell>{entry.hours.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(entry)}
                            disabled={loading}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(entry.id)}
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
