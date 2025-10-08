import { useState, useMemo } from 'react';
import { X, Search, Filter, Grid, List } from 'lucide-react';
import { BadgeNFT, CollectibleNFT, FSN_NFT, BADGE_REGISTRY, COLLECTIBLE_REGISTRY } from '@/lib/badgeSystem';
import BadgeCard from './BadgeCard';

interface BadgeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userNFTs: FSN_NFT[];
}

type FilterType = 'all' | 'badges' | 'signal' | 'trust' | 'quests' | 'collectibles';
type SortType = 'recent' | 'alphabetical' | 'rarity';
type ViewType = 'grid' | 'list';

const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };

export default function BadgeLibraryModal({ isOpen, onClose, userNFTs }: BadgeLibraryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('recent');
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [equippedBadge, setEquippedBadge] = useState<string | null>(
    localStorage.getItem('equippedBadge')
  );

  // Handle badge equip/unequip
  const handleEquipBadge = (badgeId: string) => {
    if (equippedBadge === badgeId) {
      // Unequip
      localStorage.removeItem('equippedBadge');
      setEquippedBadge(null);
    } else {
      // Equip
      localStorage.setItem('equippedBadge', badgeId);
      setEquippedBadge(badgeId);
    }
  };

  // Combine all available NFTs with user's earned status
  const allNFTs = useMemo(() => {
    const userNFTIds = userNFTs.map(nft => nft.id);
    
    // Default earned badges - ensure user has some badges available to equip
    const defaultEarnedBadges = ['badge_core_signal', 'badge_trust_verified', 'badge_onboarding'];
    
    const allBadges = BADGE_REGISTRY.map(badge => ({
      ...badge,
      isEarned: userNFTIds.includes(badge.id) || defaultEarnedBadges.includes(badge.id),
      dateEarned: userNFTs.find(nft => nft.id === badge.id)?.dateEarned
    }));

    const allCollectibles = COLLECTIBLE_REGISTRY.map(collectible => ({
      ...collectible,
      isEarned: userNFTIds.includes(collectible.id),
      dateEarned: userNFTs.find(nft => nft.id === collectible.id)?.dateEarned
    }));

    return [...allBadges, ...allCollectibles];
  }, [userNFTs]);

  // Filter and sort NFTs
  const filteredNFTs = useMemo(() => {
    let filtered = allNFTs;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    switch (filter) {
      case 'badges':
        filtered = filtered.filter(nft => nft.type === 'badge');
        break;
      case 'signal':
        filtered = filtered.filter(nft => nft.type === 'badge' && nft.earnedFrom === 'Signal');
        break;
      case 'trust':
        filtered = filtered.filter(nft => nft.type === 'badge' && nft.earnedFrom === 'Trust');
        break;
      case 'quests':
        filtered = filtered.filter(nft => nft.type === 'badge' && (nft.earnedFrom === 'Quest' || nft.earnedFrom === 'XP'));
        break;
      case 'collectibles':
        filtered = filtered.filter(nft => nft.type === 'collectible');
        break;
    }

    // Apply sorting
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rarity':
        filtered.sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
        break;
      case 'recent':
        filtered.sort((a, b) => {
          if (a.dateEarned && b.dateEarned) {
            return new Date(b.dateEarned).getTime() - new Date(a.dateEarned).getTime();
          }
          if (a.dateEarned) return -1;
          if (b.dateEarned) return 1;
          return 0;
        });
        break;
    }

    return filtered;
  }, [allNFTs, searchTerm, filter, sortBy]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(12px)'
    }}
    onClick={onClose}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(31, 41, 55, 0.95) 100%)',
        border: '2px solid #00f0ff',
        borderRadius: '20px',
        padding: '32px',
        width: '90%',
        maxWidth: '1200px',
        maxHeight: '80vh',
        position: 'relative',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 30px #00f0ff33',
        overflow: 'hidden'
      }}
      onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.3)'
        }}>
          <h1 style={{
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#00f0ff',
            margin: 0,
            textShadow: '0 0 10px #00f0ff44'
          }}>
            FSN Library
          </h1>
          
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1', minWidth: '300px' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#9ca3af'
            }} />
            <input
              type="text"
              placeholder="Search badges and NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0, 20, 40, 0.8)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                borderRadius: '8px',
                padding: '10px 12px 10px 40px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'Orbitron, sans-serif'
              }}
            />
          </div>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            style={{
              background: 'rgba(0, 20, 40, 0.8)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'Orbitron, sans-serif',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Items</option>
            <option value="badges">Badges</option>
            <option value="signal">Signal</option>
            <option value="trust">Trust</option>
            <option value="quests">Quests</option>
            <option value="collectibles">Collectibles</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            style={{
              background: 'rgba(0, 20, 40, 0.8)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'Orbitron, sans-serif',
              cursor: 'pointer'
            }}
          >
            <option value="recent">Most Recent</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="rarity">Rarity</option>
          </select>

          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => setViewType('grid')}
              style={{
                background: viewType === 'grid' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 20, 40, 0.8)',
                border: `1px solid ${viewType === 'grid' ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
                color: viewType === 'grid' ? '#00f0ff' : '#9ca3af',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewType('list')}
              style={{
                background: viewType === 'list' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 20, 40, 0.8)',
                border: `1px solid ${viewType === 'list' ? '#00f0ff' : 'rgba(0, 240, 255, 0.3)'}`,
                color: viewType === 'list' ? '#00f0ff' : '#9ca3af',
                padding: '8px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Results */}
        <div style={{
          height: '60vh',
          overflowY: 'auto',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 240, 255, 0.1)'
        }}>
          {filteredNFTs.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: viewType === 'grid' 
                ? 'repeat(auto-fill, minmax(120px, 1fr))' 
                : '1fr',
              gap: '16px'
            }}>
              {filteredNFTs.map((nft, index) => (
                <div key={`${nft.id}-${index}`} style={{
                  opacity: (nft as any).isEarned ? 1 : 0.6,
                  position: 'relative'
                }}>
                  <BadgeCard
                    badge={nft as BadgeNFT}
                    size={viewType === 'grid' ? 'medium' : 'small'}
                    showDetails={true}
                    showRarityRing={true}
                    isEarned={(nft as any).isEarned || false}
                    onEquip={handleEquipBadge}
                    showEquipButton={true}
                  />
                  {!(nft as any).isEarned && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      fontFamily: 'Orbitron, sans-serif',
                      border: '1px solid rgba(107, 114, 128, 0.5)',
                      pointerEvents: 'none'
                    }}>
                      LOCKED
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontFamily: 'Orbitron, sans-serif'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No items found</div>
              <div style={{ fontSize: '14px' }}>Try adjusting your search or filters</div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'rgba(0, 240, 255, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          fontFamily: 'Orbitron, sans-serif',
          color: '#00f0ff'
        }}>
          <span>
            Showing {filteredNFTs.length} items • {filteredNFTs.filter(nft => (nft as any).isEarned).length} earned
          </span>
          <span>
            {Math.round((filteredNFTs.filter(nft => (nft as any).isEarned).length / allNFTs.length) * 100)}% collection complete
          </span>
        </div>
      </div>
    </div>
  );
}