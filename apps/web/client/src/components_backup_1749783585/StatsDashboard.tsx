import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart2, TrendingUp, Clock, Filter } from 'lucide-react';
import '../styles/dashboard-extensions.css';

interface StatsData {
  xpHistory: any[];
  activityBreakdown: any[];
  questCompletion: any[];
}

interface StatsDashboardProps {
  userId?: number | null;
}

/**
 * Interactive statistics dashboard with charts and visualizations
 * Displays user XP growth, activity breakdown, and other metrics
 */
const StatsDashboard: React.FC<StatsDashboardProps> = ({ userId }) => {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<string>('week');
  
  // Load stats data (would connect to API in production)
  useEffect(() => {
    if (!userId) return;
    
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      // Example data (would be fetched from API in production)
      const demoStatsData: StatsData = {
        // XP gained over time
        xpHistory: [
          { day: 'Mon', xp: 30 },
          { day: 'Tue', xp: 85 },
          { day: 'Wed', xp: 45 },
          { day: 'Thu', xp: 125 },
          { day: 'Fri', xp: 60 },
          { day: 'Sat', xp: 40 },
          { day: 'Sun', xp: 95 }
        ],
        
        // Activity type breakdown
        activityBreakdown: [
          { name: 'Messaging', value: 45 },
          { name: 'Quests', value: 30 },
          { name: 'File Storage', value: 15 },
          { name: 'Logins', value: 10 }
        ],
        
        // Quest completion rates
        questCompletion: [
          { name: 'Signal Discovery', completed: 65, total: 100 },
          { name: 'Connect Agents', completed: 66, total: 100 },
          { name: 'Vault Usage', completed: 40, total: 100 },
          { name: 'Daily Tasks', completed: 80, total: 100 }
        ]
      };
      
      setStatsData(demoStatsData);
      setLoading(false);
    }, 1200);
    
    return () => clearTimeout(timer);
  }, [userId]);
  
  // Handle time range change with real data updates
  const handleRangeChange = (range: string) => {
    setTimeRange(range);
    setLoading(true);
    
    // Generate realistic data based on time range
    setTimeout(() => {
      const generateTimeData = () => {
        if (range === 'week') {
          return {
            xpHistory: [
              { day: 'Mon', xp: 30 },
              { day: 'Tue', xp: 85 },
              { day: 'Wed', xp: 45 },
              { day: 'Thu', xp: 125 },
              { day: 'Fri', xp: 60 },
              { day: 'Sat', xp: 40 },
              { day: 'Sun', xp: 95 }
            ],
            activityBreakdown: [
              { name: 'Messaging', value: 45 },
              { name: 'Quests', value: 30 },
              { name: 'File Storage', value: 15 },
              { name: 'Logins', value: 10 }
            ]
          };
        } else if (range === 'month') {
          return {
            xpHistory: [
              { day: 'Week 1', xp: 240 },
              { day: 'Week 2', xp: 315 },
              { day: 'Week 3', xp: 420 },
              { day: 'Week 4', xp: 380 }
            ],
            activityBreakdown: [
              { name: 'Messaging', value: 35 },
              { name: 'Quests', value: 40 },
              { name: 'File Storage', value: 15 },
              { name: 'Logins', value: 10 }
            ]
          };
        } else { // year
          return {
            xpHistory: [
              { day: 'Jan', xp: 850 },
              { day: 'Feb', xp: 920 },
              { day: 'Mar', xp: 1100 },
              { day: 'Apr', xp: 1350 },
              { day: 'May', xp: 1250 },
              { day: 'Jun', xp: 1420 }
            ],
            activityBreakdown: [
              { name: 'Messaging', value: 30 },
              { name: 'Quests', value: 35 },
              { name: 'File Storage', value: 25 },
              { name: 'Logins', value: 10 }
            ]
          };
        }
      };
      
      const timeData = generateTimeData();
      setStatsData({
        ...timeData,
        questCompletion: [
          { name: 'Signal Discovery', completed: 65, total: 100 },
          { name: 'Connect Agents', completed: 66, total: 100 },
          { name: 'Vault Usage', completed: 40, total: 100 },
          { name: 'Daily Tasks', completed: 80, total: 100 }
        ]
      });
      setLoading(false);
    }, 500);
  };
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${label}`}</p>
          <p className="tooltip-value">{`${payload[0].value} XP`}</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <BarChart2 size={18} style={{ marginRight: '8px' }} />
          Performance Dashboard
        </div>
        <div className="chart-period-selector">
          <button 
            className={`period-button ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => handleRangeChange('week')}
          >
            Week
          </button>
          <button 
            className={`period-button ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => handleRangeChange('month')}
          >
            Month
          </button>
          <button 
            className={`period-button ${timeRange === 'year' ? 'active' : ''}`}
            onClick={() => handleRangeChange('year')}
          >
            Year
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="stats-loading">
          <p>Loading statistics...</p>
        </div>
      ) : statsData ? (
        <div className="stats-content">
          {/* XP Growth Chart */}
          <div className="chart-section">
            <h3 className="chart-section-title">
              <TrendingUp size={16} style={{ marginRight: '8px' }} />
              XP Growth
            </h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statsData.xpHistory}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis hide={true} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="xp" 
                    fill="#66fcf1" 
                    radius={[4, 4, 0, 0]} 
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Activity Breakdown */}
          <div className="chart-section">
            <h3 className="chart-section-title">
              <Clock size={16} style={{ marginRight: '8px' }} />
              Activity Breakdown
            </h3>
            <div className="activity-breakdown">
              {statsData.activityBreakdown.map((activity, index) => (
                <div key={activity.name} className="activity-stat">
                  <div className="activity-stat-label">{activity.name}</div>
                  <div className="activity-stat-bar-container">
                    <div 
                      className="activity-stat-bar" 
                      style={{ 
                        width: `${activity.value}%`,
                        backgroundColor: index === 0 ? '#66fcf1' : 
                                          index === 1 ? '#00a2ff' : 
                                          index === 2 ? '#0075ff' : '#0044ff'
                      }}
                    ></div>
                  </div>
                  <div className="activity-stat-value">{activity.value}%</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Quest Completion */}
          <div className="chart-section">
            <h3 className="chart-section-title">
              <Filter size={16} style={{ marginRight: '8px' }} />
              Quest Progress
            </h3>
            <div className="quest-progress-stats">
              {statsData.questCompletion.map((quest) => (
                <div key={quest.name} className="quest-progress-stat">
                  <div className="quest-progress-label">{quest.name}</div>
                  <div className="quest-progress-container">
                    <div 
                      className="quest-progress-value" 
                      style={{ width: `${(quest.completed / quest.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="quest-progress-percent">
                    {Math.round((quest.completed / quest.total) * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="stats-error">
          <p>Unable to load statistics</p>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;