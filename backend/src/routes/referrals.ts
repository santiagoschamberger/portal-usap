import express, { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { zohoService } from '../services/zohoService';

const router = express.Router();

/**
 * POST /api/referrals/submit
 * Submit a referral (contact form)
 */
router.post('/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { 
      corporation_name, 
      business_name, 
      first_name, 
      last_name, 
      email, 
      phone, 
      message 
    } = req.body;

    // Validate required fields
    if (!corporation_name || !business_name || !first_name || !last_name || !email || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Please fill in all required fields' 
      });
    }

    // Get user info
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's partner info
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('partner_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'Unable to find your account information' 
      });
    }

    // Get partner name and Zoho partner ID
    const { data: partnerData } = await supabaseAdmin
      .from('partners')
      .select('name, zoho_partner_id')
      .eq('id', user.partner_id)
      .single();

    const partnerName = partnerData?.name || 'Unknown Partner';
    const zohoPartnerId = partnerData?.zoho_partner_id;

    if (!zohoPartnerId) {
      return res.status(400).json({
        error: 'Partner not linked to Zoho',
        message: 'Your account is not properly configured in Zoho CRM'
      });
    }

    // Create lead in Zoho CRM
    const zohoLead = await zohoService.createLead({
      Email: email,
      First_Name: first_name,
      Last_Name: last_name,
      Company: business_name,
      Phone: phone,
      StrategicPartnerId: userId,
      Entity_Type: 'Other',
      Lead_Status: 'New',
      Lead_Source: 'Partner Referral',
      Lander_Message: message || '',
      Vendor: {
        name: partnerName,
        id: zohoPartnerId
      }
    });

    // Save to local database
    const { data: localLead, error: localError } = await supabaseAdmin
      .from('leads')
      .insert({
        partner_id: user.partner_id,
        zoho_lead_id: zohoLead.id,
        first_name,
        last_name,
        email,
        phone,
        company: business_name,
        status: 'Pre-Vet / New Lead',
        lead_source: 'Partner Referral',
        created_by: userId,
        notes: message || null
      })
      .select()
      .single();

    if (localError) {
      console.error('Error saving lead locally:', localError);
      return res.status(500).json({ 
        error: 'Failed to save lead',
        message: 'Lead was created in Zoho but failed to save locally' 
      });
    }

    res.status(201).json({ 
      success: true,
      message: 'Referral submitted successfully',
      lead: localLead 
    });

  } catch (error: any) {
    console.error('Error submitting referral:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message || 'Failed to submit referral' 
    });
  }
});

export default router;
