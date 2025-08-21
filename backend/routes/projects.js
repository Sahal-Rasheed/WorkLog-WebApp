const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// List projects
router.get('/:organization_id/projects', async (req, res) => {
  try {
    const { organization_id } = req.params;

    const { data: projects, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        description,
        is_archived,
        created_at,
        users (
          name
        )
      `)
      .eq('organization_id', organization_id)
      .order('is_archived', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedProjects = projects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      is_archived: project.is_archived,
      created_by: project.users.name,
      created_at: project.created_at
    }));

    res.json({ projects: formattedProjects });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create project
router.post('/:organization_id/projects', async (req, res) => {
  try {
    const { organization_id } = req.params;
    const { name, description, created_by } = req.body;

    if (!name || !created_by) {
      return res.status(400).json({ error: 'Name and created_by are required' });
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .insert([{
        organization_id,
        name,
        description,
        created_by
      }])
      .select()
      .single();

    if (projectError) throw projectError;

    // Get creator name
    const { data: creator } = await supabaseAdmin
      .from('users')
      .select('name')
      .eq('id', created_by)
      .single();

    res.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        is_archived: project.is_archived,
        created_by: creator?.name || 'Unknown',
        created_at: project.created_at
      }
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
