import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { TimeEntry, Project } from '../types';
import { validateTimeEntry } from '../utils/validation';

interface WorklogTableProps {
  timeEntries: TimeEntry[];
  selectedProject: Project;
  selectedMonth: string;
  userEmail: string;
  onAddEntry: (entry: Omit<TimeEntry, 'entry_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onUpdateEntry: (entryId: string, updates: Partial<TimeEntry>) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  loading: boolean;
}

interface EditingEntry {
  entry_id: string;
  date: string;
  task: string;
  hours: string;
}

export function WorklogTable({
  timeEntries,
  selectedProject,
  selectedMonth,
  userEmail,
  onAddEntry,
  onUpdateEntry,
  onDeleteEntry,
  loading
}: WorklogTableProps) {
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
        date: newEntry.date,
        project_id: selectedProject.project_id,
        task: newEntry.task,
        hours: parseFloat(newEntry.hours),
        user_email: userEmail
      });

      setNewEntry({ date: '', task: '', hours: '' });
      setIsAddingNew(false);
      toast({
        title: "Success",
        description: "Time entry added successfully",
      });
    } catch (error) {
      console.error('Failed to add entry:', error);
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry({
      entry_id: entry.entry_id,
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
      await onUpdateEntry(editingEntry.entry_id, {
        date: editingEntry.date,
        task: editingEntry.task,
        hours: parseFloat(editingEntry.hours),
        updated_at: new Date().toISOString()
      });

      setEditingEntry(null);
      toast({
        title: "Success",
        description: "Time entry updated successfully",
      });
    } catch (error) {
      console.error('Failed to update entry:', error);
      toast({
        title: "Error",
        description: "Failed to update time entry",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return;

    try {
      await onDeleteEntry(entryId);
      toast({
        title: "Success",
        description: "Time entry deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete entry:', error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
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
      <div className="border-b pb-4">
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedEntries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                No time entries for this month. Add your first entry above.
              </TableCell>
            </TableRow>
          ) : (
            sortedEntries.map((entry) => (
              <TableRow key={entry.entry_id}>
                {editingEntry?.entry_id === entry.entry_id ? (
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
                    <TableCell>{entry.user_email}</TableCell>
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
                    <TableCell>{entry.user_email}</TableCell>
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
                          onClick={() => handleDelete(entry.entry_id)}
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
  );
}
