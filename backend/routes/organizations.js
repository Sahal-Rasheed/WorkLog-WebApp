const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Create organization
router.post('/', async (req, res) => {
  try {
    const { name, user_id } = req.body;

    if (!name || !user_id) {
      return res.status(400).json({ error: 'Name and user_id are required' });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingOrg) {
      return res.status(409).json({ error: 'Organization name already taken' });
    }

    // Create organization
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([{ name, slug }])
      .select()
      .single();

    if (orgError) throw orgError;

    // Add user as admin
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .insert([{
        organization_id: organization.id,
        user_id,
        role: 'admin',
        status: 'active',
        joined_at: new Date().toISOString()
      }]);

    if (memberError) throw memberError;

    // Create default project
    const { error: projectError } = await supabaseAdmin
      .from('projects')
      .insert([{
        organization_id: organization.id,
        name: 'General',
        description: 'Default project for general tasks',
        created_by: user_id
      }]);

    if (projectError) throw projectError;

    res.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug
      }
    });
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Request to join organization
router.post('/join', async (req, res) => {
  try {
    const { organization_id, user_id } = req.body;

    if (!organization_id || !user_id) {
      return res.status(400).json({ error: 'Organization ID and user ID are required' });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('organization_members')
      .select('id, status')
      .eq('organization_id', organization_id)
      .eq('user_id', user_id)
      .single();

    if (existingMember) {
      if (existingMember.status === 'active') {
        return res.status(409).json({ error: 'You are already a member of this organization' });
      } else if (existingMember.status === 'pending') {
        return res.status(409).json({ error: 'Your request to join is already pending approval' });
      }
    }

    // Add user as pending member
    const { error } = await supabaseAdmin
      .from('organization_members')
      .upsert([{
        organization_id,
        user_id,
        role: 'member',
        status: 'pending'
      }]);

    if (error) throw error;

    res.json({
      success: true,
      requires_approval: true
    });
  } catch (error) {
    console.error('Join organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept invitation
router.post('/accept-invitation', async (req, res) => {
  try {
    const { token, user_id } = req.body;

    if (!token || !user_id) {
      return res.status(400).json({ error: 'Token and user ID are required' });
    }

    // Find and validate invitation
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('invitations')
      .select(`
        *,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (invError || !invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    // Check if user email matches invitation
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', user_id)
      .single();

    if (!user || user.email !== invitation.email) {
      return res.status(400).json({ error: 'Invitation email does not match your account' });
    }

    // Add user to organization
    const { error: memberError } = await supabaseAdmin
      .from('organization_members')
      .upsert([{
        organization_id: invitation.organization_id,
        user_id,
        role: invitation.role,
        status: 'active',
        invited_by: invitation.invited_by,
        invited_at: invitation.created_at,
        joined_at: new Date().toISOString()
      }]);

    if (memberError) throw memberError;

    // Mark invitation as accepted
    const { error: updateError } = await supabaseAdmin
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    if (updateError) throw updateError;

    res.json({
      organization: {
        id: invitation.organizations.id,
        name: invitation.organizations.name,
        slug: invitation.organizations.slug
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get organization members
router.get('/:organization_id/members', async (req, res) => {
  try {
    const { organization_id } = req.params;

    const { data: members, error } = await supabaseAdmin
      .from('organization_members')
      .select(`
        id,
        user_id,
        role,
        status,
        joined_at,
        users (
          email,
          name,
          avatar_url
        ),
        invited_by:users!organization_members_invited_by_fkey (
          name
        )
      `)
      .eq('organization_id', organization_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const formattedMembers = members.map(member => ({
      id: member.id,
      user_id: member.user_id,
      email: member.users.email,
      name: member.users.name,
      avatar_url: member.users.avatar_url,
      role: member.role,
      status: member.status,
      joined_at: member.joined_at,
      invited_by_name: member.invited_by?.name
    }));

    res.json({ members: formattedMembers });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve member
router.post('/:organization_id/members/:member_id/approve', async (req, res) => {
  try {
    const { organization_id, member_id } = req.params;

    const { error } = await supabaseAdmin
      .from('organization_members')
      .update({
        status: 'active',
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', member_id)
      .eq('organization_id', organization_id)
      .eq('status', 'pending');

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Approve member error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Invite user
router.post('/:organization_id/invite', async (req, res) => {
  try {
    const { organization_id } = req.params;
    const { email, role, invited_by } = req.body;

    if (!email || !role || !invited_by) {
      return res.status(400).json({ error: 'Email, role, and invited_by are required' });
    }

    // Check if user is already a member
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const { data: existingMember } = await supabaseAdmin
        .from('organization_members')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return res.status(409).json({ error: 'User is already a member of this organization' });
      }
    }

    // Check for existing invitation
    const { data: existingInvitation } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      return res.status(409).json({ error: 'User already has a pending invitation' });
    }

    // Generate invitation token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation
    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .insert([{
        organization_id,
        email,
        role,
        invited_by,
        token,
        expires_at: expiresAt.toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      invitation_id: invitation.id
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
