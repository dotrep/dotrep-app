import React, { useState, useEffect } from 'react';

interface SimpleProfileManagementProps {
  userId: number;
  fsnName: string;
}

interface UserProfile {
  isPublic: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
}

const SimpleProfileManagement: React.FC<SimpleProfileManagementProps> = ({ userId, fsnName }) => {
  const [profile, setProfile] = useState<UserProfile>({ isPublic: true });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setProfile({
          isPublic: userData.isPublic ?? true,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const updateVisibility = async (isPublic: boolean) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/${userId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic }),
      });

      if (response.ok) {
        setProfile(prev => ({ ...prev, isPublic }));
        setMessage(isPublic ? 'Your FSN name is now public' : 'Your FSN name is now private');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update visibility setting');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      setMessage('Failed to update visibility setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted/20 border rounded-md p-4">
      <h3 className="text-lg font-semibold mb-3 text-teal-300">Profile Settings</h3>
      
      {message && (
        <div className="mb-3 p-2 bg-muted border rounded text-sm">
          {message}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input 
              type="checkbox" 
              checked={profile.isPublic} 
              onChange={(e) => updateVisibility(e.target.checked)}
              disabled={loading}
              className="rounded border-muted focus:ring-teal-500"
            />
            <span>Make my .fsn name public (visible on global map)</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1 ml-6">
            {profile.isPublic ? 
              `${fsnName} will be visible to other users` : 
              `${fsnName} will be private and hidden from public view`
            }
          </p>
        </div>

        {profile.email && (
          <div className="pt-2 border-t border-muted">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Email:</span> {profile.email}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleProfileManagement;