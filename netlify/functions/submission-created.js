/**
 * Netlify Function: submission-created
 *
 * Auto-fires on every Netlify Forms submission.
 * Writes lead data to Supabase `leads` table.
 *
 * Handles these forms:
 *   - "contact" (contact page: name, email, phone, message, inquiry_type)
 *   - "email-capture" (homepage newsletter: email)
 *   - "blog-subscribe" (blog page: email)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL,
  process.env.PUBLIC_SUPABASE_ANON_KEY
);

export const handler = async (event) => {
  try {
    const { payload } = JSON.parse(event.body);
    const { form_name, data, ordered_human_fields } = payload;

    // Extract common fields
    const email = data.email;
    if (!email) {
      console.log('No email in submission, skipping Supabase insert');
      return { statusCode: 200, body: 'No email provided' };
    }

    // Build lead record based on form type
    const lead = {
      email,
      source: `form:${form_name}`,
      captured_at: new Date().toISOString(),
    };

    // Extract UTM params if present (from hidden fields or query string)
    if (data.utm_source) lead.utm_source = data.utm_source;
    if (data.utm_medium) lead.utm_medium = data.utm_medium;
    if (data.utm_campaign) lead.utm_campaign = data.utm_campaign;

    switch (form_name) {
      case 'contact':
        lead.name = data.name || null;
        lead.phone = data.phone || null;
        // Store inquiry type and message in lead_magnet field for context
        if (data.inquiry_type || data.message) {
          lead.lead_magnet = `inquiry:${data.inquiry_type || 'general'} | ${(data.message || '').substring(0, 200)}`;
        }
        break;

      case 'email-capture':
        lead.lead_magnet = 'newsletter';
        break;

      case 'blog-subscribe':
        lead.lead_magnet = 'blog-subscribe';
        break;

      default:
        lead.lead_magnet = form_name;
        break;
    }

    // Insert into Supabase leads table
    const { data: inserted, error } = await supabase
      .from('leads')
      .insert(lead)
      .select('id')
      .single();

    if (error) {
      // If duplicate email, update instead
      if (error.code === '23505') {
        console.log(`Duplicate email ${email}, updating existing lead`);
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            source: lead.source,
            lead_magnet: lead.lead_magnet,
            name: lead.name || undefined,
            phone: lead.phone || undefined,
            captured_at: lead.captured_at,
          })
          .eq('email', email);

        if (updateError) {
          console.error('Error updating lead:', updateError);
          return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) };
        }
        return { statusCode: 200, body: 'Lead updated' };
      }

      console.error('Error inserting lead:', error);
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }

    console.log(`Lead captured: ${email} from ${form_name} (id: ${inserted.id})`);
    return { statusCode: 200, body: JSON.stringify({ id: inserted.id }) };

  } catch (err) {
    console.error('submission-created function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
