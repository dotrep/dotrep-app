import React from 'react';
import Picture6FullScreen from './Picture6FullScreen';
import '../styles/fsn.css';

interface VaultTabProps {
  userId: number;
  fsnName: string;
}

const VaultTab: React.FC<VaultTabProps> = ({ userId, fsnName }) => {
  // Return the fullscreen component directly without any wrapper
  return <Picture6FullScreen userId={userId} fsnName={fsnName} />;
};

export default VaultTab;