import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Terminal, Trophy, Clock, Users, RefreshCw, Crown, Medal, Award } from 'lucide-react';

interface TeamProgress {
  teamName: string;
  level: number;
  timestamp: Date;
  hasPassword: boolean;
}

interface ProgressData {
  success: boolean;
  teams: TeamProgress[];
}

export default function Admin() {
  const [progressData, setProgressData] = useState<TeamProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchProgress = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/team-progress');
      const data: ProgressData = await response.json();
      
      if (data.success) {
        const teamsWithDates = data.teams.map(team => ({
          ...team,
          timestamp: new Date(team.timestamp)
        }));
        setProgressData(teamsWithDates);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProgress, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-5 w-5 text-yellow-500" />;
      case 1: return <Medal className="h-5 w-5 text-gray-400" />;
      case 2: return <Award className="h-5 w-5 text-amber-600" />;
      default: return <Trophy className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLevelBadgeColor = (level: number) => {
    if (level >= 8) return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (level >= 6) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (level >= 4) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (level >= 2) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    return 'bg-primary/20 text-primary border-primary/30';
  };

  const getStats = () => {
    const totalTeams = progressData.length;
    const completedLevels = progressData.reduce((acc, team) => acc + team.level, 0);
    const highestLevel = progressData.length > 0 ? Math.max(...progressData.map(t => t.level)) : 0;
    const averageLevel = totalTeams > 0 ? (completedLevels / totalTeams).toFixed(1) : '0';

    return { totalTeams, completedLevels, highestLevel, averageLevel };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary">
      {/* Header */}
      <header className="border-b border-border/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-8 w-8 text-primary animate-pulse" />
              <div>
                <h1 className="text-xl font-mono font-bold text-primary">ADMIN DASHBOARD</h1>
                <p className="text-sm text-muted-foreground font-mono">Treasure in the Shell - Team Progress</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {lastUpdated && (
                <div className="text-xs text-muted-foreground font-mono">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <Button 
                onClick={fetchProgress} 
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="font-mono"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/50 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-muted-foreground">Total Teams</p>
                  <p className="text-2xl font-bold text-primary">{stats.totalTeams}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-terminal-400/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-muted-foreground">Highest Level</p>
                  <p className="text-2xl font-bold text-terminal-400">{stats.highestLevel}</p>
                </div>
                <Crown className="h-8 w-8 text-terminal-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-orange-400/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-muted-foreground">Average Level</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.averageLevel}</p>
                </div>
                <Trophy className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-blue-400/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-mono text-muted-foreground">Total Progress</p>
                  <p className="text-2xl font-bold text-blue-400">{stats.completedLevels}</p>
                </div>
                <Award className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Progress Table */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Trophy className="h-5 w-5" />
              Team Leaderboard
            </CardTitle>
            <CardDescription>
              Real-time progress tracking for all participating teams
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && progressData.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mr-2" />
                <span className="font-mono text-muted-foreground">Loading team data...</span>
              </div>
            ) : progressData.length === 0 ? (
              <div className="text-center py-8">
                <Terminal className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-mono text-muted-foreground">No teams have submitted passwords yet</p>
                <p className="text-sm font-mono text-muted-foreground/60 mt-2">
                  Submissions will appear here in real-time
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {progressData.map((team, index) => (
                  <div 
                    key={team.teamName}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-500/10 to-primary/10 border-yellow-500/30' 
                        : 'bg-muted/30 border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(index)}
                      </div>
                      <div>
                        <h3 className="font-mono font-semibold text-foreground">
                          {team.teamName}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {team.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge 
                        className={`font-mono px-3 py-1 ${getLevelBadgeColor(team.level)}`}
                      >
                        Level {team.level}
                      </Badge>
                      {index < 3 && (
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Level Distribution */}
        {progressData.length > 0 && (
          <Card className="mt-8 bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Terminal className="h-5 w-5" />
                Level Distribution
              </CardTitle>
              <CardDescription>
                How many teams have reached each level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 lg:grid-cols-10 gap-2">
                {Array.from({ length: 10 }, (_, i) => {
                  const level = i + 1;
                  const teamsAtLevel = progressData.filter(t => t.level >= level).length;
                  const percentage = progressData.length > 0 ? (teamsAtLevel / progressData.length) * 100 : 0;
                  
                  return (
                    <div key={level} className="text-center">
                      <div 
                        className="w-full h-20 bg-muted/30 border border-border rounded flex items-end justify-center relative overflow-hidden"
                      >
                        <div 
                          className="w-full bg-gradient-to-t from-primary/60 to-primary/20 transition-all duration-500"
                          style={{ height: `${percentage}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">
                          {level}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {teamsAtLevel} teams
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
