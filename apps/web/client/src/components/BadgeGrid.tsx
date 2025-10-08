import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import BadgeCard from './BadgeCard';
import {
  FaHammer,
  FaUserCheck,
  FaFire,
  FaMoon,
  FaHeart,
  FaUserAlt,
  FaWifi,
  FaLink,
  FaCrown,
  FaRocket,
  FaStar
} from 'react-icons/fa';
import { Shield } from 'lucide-react';

interface BadgeGridProps {
  userId: number;
  userXp?: number;
}

interface UserStats {
  xpPoints: number;
  level: number;
  signalsSent: number;
  connectionsCount: number;
  lastActive: string;
}

const badges = [
  { 
    id: 'newcomer',
    icon: <FaUserAlt />, 
    title: "Newcomer", 
    description: "Recently joined FSN",
    category: "Milestone",
    xpRequired: 0,
    condition: () => true
  },
  { 
    id: 'verified',
    icon: <FaUserCheck />, 
    title: "Verified", 
    description: "Account confirmed",
    category: "Status",
    xpRequired: 50,
    condition: (stats: UserStats) => stats.xpPoints >= 50
  },
  { 
    id: 'connector',
    icon: <FaLink />, 
    title: "Connector", 
    description: "Built network connections",
    category: "Social",
    xpRequired: 100,
    condition: (stats: UserStats) => stats.connectionsCount >= 5
  },
  { 
    id: 'creator',
    icon: <FaHammer />, 
    title: "Creator", 
    description: "Designs and builds",
    category: "Engagement",
    xpRequired: 200,
    condition: (stats: UserStats) => stats.signalsSent >= 10
  },
  { 
    id: 'night_owl',
    icon: <FaMoon />, 
    title: "Night Owl", 
    description: "Active late at night",
    category: "Behavioral",
    xpRequired: 150,
    condition: (stats: UserStats) => {
      const hour = new Date(stats.lastActive).getHours();
      return hour >= 22 || hour <= 4;
    }
  },
  { 
    id: 'echo',
    icon: <FaWifi />, 
    title: "Echo", 
    description: "Signal resonator",
    category: "Engagement",
    xpRequired: 300,
    condition: (stats: UserStats) => stats.signalsSent >= 25
  },
  { 
    id: 'forgewalker',
    icon: <FaFire />, 
    title: "Forgewalker", 
    description: "Deeply engaged user",
    category: "Engagement",
    xpRequired: 500,
    condition: (stats: UserStats) => stats.xpPoints >= 500
  },
  { 
    id: 'favored',
    icon: <FaHeart />, 
    title: "Favored", 
    description: "Actively engaged",
    category: "Social",
    xpRequired: 400,
    condition: (stats: UserStats) => stats.connectionsCount >= 15
  },
  { 
    id: 'guardian',
    icon: <Shield size={48} />, 
    title: "Guardian", 
    description: "Network protector",
    category: "Elite",
    xpRequired: 750,
    condition: (stats: UserStats) => stats.level >= 5
  },
  { 
    id: 'pioneer',
    icon: <FaRocket />, 
    title: "Pioneer", 
    description: "Early adopter",
    category: "Elite",
    xpRequired: 1000,
    condition: (stats: UserStats) => stats.xpPoints >= 1000
  },
  { 
    id: 'legend',
    icon: <FaCrown />, 
    title: "Legend", 
    description: "FSN master",
    category: "Elite",
    xpRequired: 2000,
    condition: (stats: UserStats) => stats.xpPoints >= 2000 && stats.level >= 10
  },
  { 
    id: 'stellar',
    icon: <FaStar />, 
    title: "Stellar", 
    description: "Outstanding contributor",
    category: "Elite",
    xpRequired: 1500,
    condition: (stats: UserStats) => stats.signalsSent >= 100 && stats.connectionsCount >= 50
  }
];

const categories = ["All", "Milestone", "Status", "Social", "Engagement", "Behavioral", "Elite"];

const BadgeGrid: React.FC<BadgeGridProps> = ({ userId, userXp = 0 }) => {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Fetch user stats
  const { data: userStats } = useQuery<UserStats>({
    queryKey: [`/api/user/stats/${userId}`],
    enabled: !!userId,
  });

  const filteredBadges = selectedCategory === "All" 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);

  const checkBadgeEarned = (badge: any) => {
    if (!userStats) return false;
    return badge.condition(userStats);
  };

  return (
    <div className="bg-transparent min-h-screen flex flex-col items-center justify-start py-6">
      <h1 className="text-3xl font-bold text-teal-300 mb-6 text-center">
        FSN Achievement Badges
      </h1>
      
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`
              px-4 py-2 rounded-lg border transition-all duration-300 text-sm font-medium
              ${selectedCategory === category 
                ? 'bg-teal-500 text-black border-teal-500' 
                : 'bg-transparent text-teal-300 border-teal-300 hover:bg-teal-500 hover:text-black'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 max-w-7xl">
        {filteredBadges.map((badge) => {
          const earned = checkBadgeEarned(badge);
          return (
            <BadgeCard
              key={badge.id}
              icon={badge.icon}
              title={badge.title}
              description={badge.description}
              earned={earned}
              xpRequired={badge.xpRequired}
              currentXp={userStats?.xpPoints || 0}
            />
          );
        })}
      </div>

      {/* Stats Summary */}
      {userStats && (
        <div className="mt-8 text-center">
          <div className="text-lg text-teal-300 mb-2">
            Progress Summary
          </div>
          <div className="flex justify-center gap-6 text-sm text-teal-200">
            <span>Level: {userStats.level}</span>
            <span>XP: {userStats.xpPoints}</span>
            <span>Signals: {userStats.signalsSent}</span>
            <span>Connections: {userStats.connectionsCount}</span>
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Badges Earned: {filteredBadges.filter(checkBadgeEarned).length} / {filteredBadges.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default BadgeGrid;