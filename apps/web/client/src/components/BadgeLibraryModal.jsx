import React, { useState } from 'react';
import { X, Filter, ArrowUpDown } from 'lucide-react';
import BadgeCard from './BadgeCard';
import { getAllBadges, filterAndSortBadges } from '../utils/badgeLogic';
import { getBadgeIcon } from '../lib/badgeIcons';

const BadgeLibraryModal = ({ 
  isOpen, 
  onClose, 
  userStats, 
  userProgress = {},
  onEquipBadge 
}) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');

  console.log('🔥 BadgeLibraryModal render state:', { isOpen, userStats, userProgress, hasOnEquipBadge: !!onEquipBadge });
  
  if (!isOpen) {
    console.log('🚫 BadgeLibraryModal returning null - isOpen is false');
    return null;
  }
  
  console.log('✅ BadgeLibraryModal is OPEN - proceeding with render');

  const allBadges = getAllBadges(userStats, userProgress);
  console.log('🎯 BadgeLibraryModal allBadges:', allBadges);
  console.log('🎯 BadgeLibraryModal userStats:', userStats);
  console.log('🎯 BadgeLibraryModal userProgress:', userProgress);
  const filteredBadges = filterAndSortBadges(allBadges, filter, sortBy);
  console.log('🎯 BadgeLibraryModal filteredBadges:', filteredBadges);

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'earned', label: 'Earned' },
    { value: 'locked', label: 'Locked' }
  ];

  const sortOptions = [
    { value: 'rarity', label: 'Rarity' },
    { value: 'xpValue', label: 'XP Value' },
    { value: 'mostRecent', label: 'Most Recent' }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 20, 40, 0.95) 0%, rgba(0, 30, 60, 0.95) 100%)',
        borderRadius: '16px',
        padding: '24px',
        width: '90%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'hidden',
        border: '2px solid rgba(0, 188, 212, 0.3)',
        boxShadow: '0 0 30px rgba(0, 188, 212, 0.2)',
        fontFamily: 'Orbitron, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(0, 188, 212, 0.2)',
          paddingBottom: '16px'
        }}>
          <h2 style={{
            color: '#00bcd4',
            margin: 0,
            fontSize: '24px',
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0, 188, 212, 0.6)'
          }}>
            FSN Badge Library
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.color = '#00bcd4';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = '#ffffff';
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Filter and Sort Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#00bcd4' }} />
            <span style={{ color: '#ffffff', fontSize: '14px' }}>Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                background: 'rgba(0, 20, 40, 0.8)',
                border: '1px solid rgba(0, 188, 212, 0.4)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '4px 8px',
                fontSize: '12px',
                fontFamily: 'Orbitron, sans-serif'
              }}
            >
              {filterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={16} style={{ color: '#00bcd4' }} />
            <span style={{ color: '#ffffff', fontSize: '14px' }}>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                background: 'rgba(0, 20, 40, 0.8)',
                border: '1px solid rgba(0, 188, 212, 0.4)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '4px 8px',
                fontSize: '12px',
                fontFamily: 'Orbitron, sans-serif'
              }}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div style={{
            marginLeft: 'auto',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '12px'
          }}>
            {filteredBadges.filter(b => b.earned).length} / {allBadges.length} Earned
          </div>
        </div>

        {/* Badge Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredBadges.map((badge) => {
            const equipHandler = badge.earned && !badge.equipped ? () => {
              console.log('🎯 BadgeLibraryModal onEquip called for:', badge.id, badge.title);
              onEquipBadge(badge.id);
            } : undefined;
            
            console.log('🔧 Badge mapping:', {
              id: badge.id,
              title: badge.title,
              earned: badge.earned,
              equipped: badge.equipped,
              hasEquipHandler: !!equipHandler
            });
            
            return (
              <BadgeCard
                key={badge.id}
                title={badge.title}
                earned={badge.earned}
                icon={getBadgeIcon(badge.id)}
                soulbound={badge.soulbound}
                equipped={badge.equipped}
                xpBonus={badge.xpBonus}
                rarity={badge.rarity}
                onEquip={equipHandler}
                size="medium"
                showActions={badge.earned}
              />
            );
          })}
        </div>

        {/* Category Legend */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 188, 212, 0.2)'
        }}>
          <div style={{ color: '#00bcd4', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold' }}>
            Rarity Legend
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', background: '#00bcd4', borderRadius: '50%' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Common</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', background: '#9c27b0', borderRadius: '50%' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Uncommon</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', background: '#ffd700', borderRadius: '50%' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Rare</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '12px', height: '12px', background: '#ffffff', borderRadius: '50%' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Legendary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BadgeLibraryModal;