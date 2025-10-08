import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Get all contacts for a user
router.get('/api/fsn/contacts/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    
    const contacts = await storage.getFsnContacts(userId);
    return res.json({ success: true, contacts });
  } catch (error) {
    console.error('Error fetching FSN contacts:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
  }
});

// Add a new contact
router.post('/api/fsn/contacts/add', async (req, res) => {
  try {
    const schema = z.object({
      userId: z.number(),
      contactFsn: z.string().min(1)
    });
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid request data',
        errors: result.error.issues
      });
    }
    
    const { userId, contactFsn } = result.data;
    
    // Check if the FSN name exists
    const fsnDomain = await storage.getFsnDomain(contactFsn);
    
    if (!fsnDomain || fsnDomain.status !== 'registered') {
      return res.status(404).json({ 
        success: false, 
        message: `FSN name "${contactFsn}" is not registered` 
      });
    }
    
    const contact = await storage.addFsnContact({ userId, contactFsn });
    return res.status(201).json({ success: true, contact });
  } catch (error) {
    console.error('Error adding FSN contact:', error);
    return res.status(500).json({ success: false, message: 'Failed to add contact' });
  }
});

// Delete a contact
router.delete('/api/fsn/contacts/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    
    if (isNaN(contactId)) {
      return res.status(400).json({ success: false, message: 'Invalid contact ID' });
    }
    
    const success = await storage.deleteFsnContact(contactId);
    
    if (success) {
      return res.json({ success: true, message: 'Contact deleted successfully' });
    } else {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
  } catch (error) {
    console.error('Error deleting FSN contact:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete contact' });
  }
});

export default router;