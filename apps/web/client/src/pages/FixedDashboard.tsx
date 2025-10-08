import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import Picture6Absolute from '@/components/Picture6Absolute';

const FixedDashboard: React.FC = () => {
  const [location] = useLocation();

  // Get user profile
  const { data: userProfile } = useQuery({
    queryKey: ['/api/user/profile'],
    retry: false,
  });

  // Get user stats
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats', (userProfile as any)?.id],
    enabled: !!(userProfile as any)?.id
  });

  const handleXPUpdate = () => {
    console.log('+10 XP awarded');
  };

  return <Picture6Absolute 
    xpPoints={(userStats as any)?.xpPoints || 50} 
    onXPUpdate={handleXPUpdate}
  />;
};

export default FixedDashboard;