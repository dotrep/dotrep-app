import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import FsnHexagon from './FsnHexagon';
import VerificationBadge from './VerificationBadge';
import { isUserVerified } from '../utils/verification';
import '../styles/verification.css';

interface Contact {
  id: number;
  userId: number;
  contactFsnName: string;
  displayName: string;
  notes?: string;
  isFriend: boolean;
  addedAt: string;
  lastTransactionAt?: string;
}

interface AddressBookProps {
  userId: number;
  onSelectContact: (fsnName: string) => void;
}

export function AddressBook({ userId, onSelectContact }: AddressBookProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const queryClient = useQueryClient();

  // Fetch contacts
  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: [`/api/contacts/${userId}`],
    enabled: !!userId,
  });

  // Add contact mutation
  const addContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactData),
      });
      if (!response.ok) throw new Error('Failed to add contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${userId}`] });
      setShowAddForm(false);
      setNewContactName('');
      setNewDisplayName('');
      setNewNotes('');
    },
  });

  // Remove contact mutation
  const removeContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove contact');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${userId}`] });
    },
  });

  const handleAddContact = () => {
    if (!newContactName.trim()) return;

    const fsnName = newContactName.endsWith('.fsn') 
      ? newContactName 
      : `${newContactName}.fsn`;

    addContactMutation.mutate({
      userId,
      contactFsnName: fsnName,
      displayName: newDisplayName.trim() || fsnName,
      notes: newNotes.trim() || null,
      isFriend: true,
    });
  };

  const filteredContacts = contacts.filter(contact =>
    contact.contactFsnName.toLowerCase().includes(searchFilter.toLowerCase()) ||
    contact.displayName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const friends = filteredContacts.filter(c => c.isFriend);
  const recentContacts = filteredContacts.filter(c => !c.isFriend && c.lastTransactionAt);

  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(100, 255, 255, 0.3)',
      borderRadius: '12px',
      padding: '20px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#64ffff', margin: 0 }}>Address Book</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            backgroundColor: 'rgba(100, 255, 255, 0.2)',
            border: '1px solid rgba(100, 255, 255, 0.5)',
            borderRadius: '6px',
            color: '#64ffff',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          {showAddForm ? 'Cancel' : '+ Add Contact'}
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(100, 255, 255, 0.3)',
            borderRadius: '6px',
            color: 'white',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <div style={{
          backgroundColor: 'rgba(100, 255, 255, 0.05)',
          border: '1px solid rgba(100, 255, 255, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: 'white', margin: '0 0 12px 0' }}>Add New Contact</h4>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              FSN Name
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(100, 255, 255, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px'
            }}>
              <input
                type="text"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Enter FSN name"
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              <span style={{ color: '#64ffff', marginLeft: '8px' }}>.fsn</span>
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              Display Name (Optional)
            </label>
            <input
              type="text"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              placeholder="Friendly name for this contact"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(100, 255, 255, 0.3)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              Notes (Optional)
            </label>
            <input
              type="text"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Personal notes about this contact"
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(100, 255, 255, 0.3)',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            onClick={handleAddContact}
            disabled={!newContactName.trim() || addContactMutation.isPending}
            style={{
              backgroundColor: newContactName.trim() ? 'rgba(100, 255, 255, 0.8)' : 'rgba(100, 255, 255, 0.3)',
              border: 'none',
              borderRadius: '6px',
              color: newContactName.trim() ? '#000' : 'rgba(255, 255, 255, 0.5)',
              padding: '10px 20px',
              cursor: newContactName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            {addContactMutation.isPending ? 'Adding...' : 'Add Contact'}
          </button>
        </div>
      )}

      {/* Friends Section */}
      {friends.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '16px' }}>
            Friends ({friends.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.map((contact) => (
              <div
                key={contact.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: 'rgba(100, 255, 100, 0.05)',
                  border: '1px solid rgba(100, 255, 100, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => onSelectContact(contact.contactFsnName)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FsnHexagon size={32} />
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                      {contact.displayName}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      {contact.contactFsnName}
                    </div>
                    {contact.notes && (
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px', marginTop: '2px' }}>
                        {contact.notes}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeContactMutation.mutate(contact.id);
                  }}
                  style={{
                    backgroundColor: 'rgba(255, 100, 100, 0.2)',
                    border: '1px solid rgba(255, 100, 100, 0.5)',
                    borderRadius: '4px',
                    color: '#ff6464',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Contacts Section */}
      {recentContacts.length > 0 && (
        <div>
          <h4 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '16px' }}>
            Recent Transactions ({recentContacts.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentContacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  backgroundColor: 'rgba(100, 255, 255, 0.05)',
                  border: '1px solid rgba(100, 255, 255, 0.2)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => onSelectContact(contact.contactFsnName)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FsnHexagon size={32} />
                  <div>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>
                      {contact.displayName}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      {contact.contactFsnName}
                    </div>
                    {contact.lastTransactionAt && (
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '11px' }}>
                        Last transaction: {new Date(contact.lastTransactionAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addContactMutation.mutate({
                      userId,
                      contactFsnName: contact.contactFsnName,
                      displayName: contact.displayName,
                      notes: null,
                      isFriend: true,
                    });
                  }}
                  style={{
                    backgroundColor: 'rgba(100, 255, 100, 0.2)',
                    border: '1px solid rgba(100, 255, 100, 0.5)',
                    borderRadius: '4px',
                    color: '#64ff64',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && filteredContacts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'rgba(255, 255, 255, 0.6)'
        }}>
          {searchFilter ? 'No contacts found matching your search.' : 'No contacts yet. Add some friends to get started!'}
        </div>
      )}
    </div>
  );
}