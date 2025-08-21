const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// List time entries
router.get('/:organization_id/time-entries', async (req, res) => {
  try {
    const { organization_id } = req.params;
    const { project_id, user_id, start_date, end_date } = req.query;

    let query = supabaseAdmin
      .from('time_entries')
      .select(`
        id,
        project_id,
        user_id,
        date,
        task,
        hours,
        created_at,
        updated_at,
        projects (
          name
        ),
        users (
          name,
          email
        )
      `)
      .eq('organization_id', organization_id);

    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    query = query.order('date', { ascending: false })
                 .order('created_at', { ascending: false });

    const { data: timeEntries, error } = await query;

    if (error) throw error;

    const formattedEntries = timeEntries.map(entry => ({
      id: entry.id,
      project_id: entry.project_id,
      project_name: entry.projects.name,
      user_id: entry.user_id,
      user_name: entry.users.name,
      user_email: entry.users.email,
      date: entry.date,
      task: entry.task,
      hours: entry.hours,
      created_at: entry.created_at,
      updated_at: entry.updated_at
    }));

    res.json({ time_entries: formattedEntries });
  } catch (error) {
    console.error('List time entries error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create time entry
router.post('/:organization_id/time-entries', async (req, res) => {
  try {
    const { organization_id } = req.params;
    const { project_id, user_id, date, task, hours } = req.body;

    if (!project_id || !user_id || !date || !task || !hours) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (hours <= 0 || hours > 24) {
      return res.status(400).json({ error: 'Hours must be between 0 and 24' });
    }

    const { data: timeEntry, error } = await supabaseAdmin
      .from('time_entries')
      .insert([{
        organization_id,
        project_id,
        user_id,
        date,
        task,
        hours
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ time_entry: timeEntry });
  } catch (error) {
    console.error('Create time entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update time entry
router.put('/:organization_id/time-entries/:entry_id', async (req, res) => {
  try {
    const { organization_id, entry_id } = req.params;
    const { date, task, hours } = req.body;

    if (hours !== undefined && (hours <= 0 || hours > 24)) {
      return res.status(400).json({ error: 'Hours must be between 0 and 24' });
    }

    const updateData = { updated_at: new Date().toISOString() };
    
    if (date !== undefined) updateData.date = date;
    if (task !== undefined) updateData.task = task;
    if (hours !== undefined) updateData.hours = hours;

    const { data: timeEntry, error } = await supabaseAdmin
      .from('time_entries')
      .update(updateData)
      .eq('id', entry_id)
      .eq('organization_id', organization_id)
      .select()
      .single();

    if (error) throw error;

    if (!timeEntry) {
      return res.status(404).json({ error: 'Time entry not found' });
    }

    res.json({ time_entry: timeEntry });
  } catch (error) {
    console.error('Update time entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete time entry
router.delete('/:organization_id/time-entries/:entry_id', async (req, res) => {
  try {
    const { organization_id, entry_id } = req.params;

    const { error } = await supabaseAdmin
      .from('time_entries')
      .delete()
      .eq('id', entry_id)
      .eq('organization_id', organization_id);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
