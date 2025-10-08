import React, { useEffect } from 'react';
import { useXP } from '../context/XPContext';
import { useToast } from './ToastManager';

const XPToastBridge = () => {
  const { toastTrigger } = useXP();
  const { showToast } = useToast();

  useEffect(() => {
    if (toastTrigger) {
      showToast({
        message: toastTrigger.message,
        type: toastTrigger.type,
        duration: toastTrigger.type === 'level-up' ? 4000 : 2500
      });
    }
  }, [toastTrigger, showToast]);

  return null; // This component doesn't render anything
};

export default XPToastBridge;