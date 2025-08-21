const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const router = express.Router();

// Login or register user
router.post('/login', async (req, res) => {
  try {
    const { email, name, avatar_url } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if user exists
    let { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw userError;
    }

    // Create or update user
    if (!user) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('users')
        .insert([{ email, name, avatar_url }])
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    } else {
      // Update user info
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ name, avatar_url, updated_at: new Date().toISOString() })
        .eq('email', email)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    }

    // Get user's organizations
    const { data: organizations, error: orgError } = await supabaseAdmin
      .from('organization_members')
      .select(`
        organizations (
          id,
          name,
          slug
        ),
        role,
        status
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (orgError) throw orgError;

    const userOrganizations = organizations.map(om => ({
      id: om.organizations.id,
      name: om.organizations.name,
      slug: om.organizations.slug,
      role: om.role,
      status: om.status
    }));

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url
      },
      organizations: userOrganizations,
      needs_organization_selection: userOrganizations.length === 0
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check email for existing account and suggestions
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    // Get suggested organizations (organizations with similar domain)
    const emailDomain = email.split('@')[1];
    const { data: suggestedOrgs } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        name,
        slug,
        organization_members!inner (
          users!inner (
            email
          )
        )
      `)
      .like('organization_members.users.email', `%@${emailDomain}`)
      .eq('organization_members.status', 'active');

    // Process suggested organizations
    const suggestions = [];
    const orgCounts = {};

    if (suggestedOrgs) {
      suggestedOrgs.forEach(org => {
        if (!orgCounts[org.id]) {
          orgCounts[org.id] = {
            id: org.id,
            name: org.name,
            slug: org.slug,
            member_count: 0
          };
        }
        orgCounts[org.id].member_count++;
      });

      suggestions.push(...Object.values(orgCounts).filter(org => org.member_count >= 2));
    }

    // Get pending invitations
    const { data: pendingInvitations } = await supabaseAdmin
      .from('invitations')
      .select(`
        id,
        token,
        organizations (
          name,
          slug
        ),
        invited_by:users!invitations_invited_by_fkey (
          name
        )
      `)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString());

    const invitations = pendingInvitations ? pendingInvitations.map(inv => ({
      id: inv.id,
      organization_name: inv.organizations.name,
      organization_slug: inv.organizations.slug,
      invited_by_name: inv.invited_by.name,
      token: inv.token
    })) : [];

    res.json({
      has_account: !!user,
      suggested_organizations: suggestions,
      pending_invitations: invitations
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
