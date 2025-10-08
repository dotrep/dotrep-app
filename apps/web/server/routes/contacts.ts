import express from 'express';

const router = express.Router();

// In-memory storage for contacts (works immediately)
const userContacts: { [userId: number]: any[] } = {};

// Get all contacts for a user
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid user ID' 
      });
    }
    
    const contacts = userContacts[userId] || [];
    return res.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
});

// Add a new contact
router.post('/', async (req, res) => {
  try {
    const { userId, contactFsnName, displayName, notes, isFriend } = req.body;
    
    if (!userId || !contactFsnName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Initialize contacts array for user if it doesn't exist
    if (!userContacts[userId]) {
      userContacts[userId] = [];
    }
    
    // Check if contact already exists
    const existingContact = userContacts[userId].find(
      contact => contact.contactFsnName === contactFsnName
    );
    
    if (existingContact) {
      return res.status(400).json({
        success: false,
        message: 'Contact already exists'
      });
    }
    
    // Create new contact
    const newContact = {
      id: Date.now(),
      userId,
      contactFsnName,
      displayName: displayName || contactFsnName,
      notes,
      isFriend: isFriend || false,
      addedAt: new Date().toISOString()
    };
    
    // Add to user's contacts
    userContacts[userId].push(newContact);
    
    return res.json({
      success: true,
      contact: newContact
    });
  } catch (error) {
    console.error('Error adding contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add contact'
    });
  }
});

// Remove a contact
router.delete('/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    if (isNaN(contactId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contact ID'
      });
    }
    
    // Find and remove contact from all users
    for (const userId in userContacts) {
      const contactIndex = userContacts[userId].findIndex(
        contact => contact.id === contactId
      );
      
      if (contactIndex !== -1) {
        userContacts[userId].splice(contactIndex, 1);
        return res.json({
          success: true,
          message: 'Contact removed successfully'
        });
      }
    }
    
    return res.status(404).json({
      success: false,
      message: 'Contact not found'
    });
  } catch (error) {
    console.error('Error removing contact:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove contact'
    });
  }
});

export default router;