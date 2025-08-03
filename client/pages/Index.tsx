import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Clock, Calendar, MapPin, Users, Trophy } from "lucide-react";

export default function Index() {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState<{
    success: boolean;
    level?: number;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamName.trim(),
          password: password.trim(),
        }),
      });

      const result = await response.json();
      setSubmission(result);

      if (result.success) {
        setPassword("");
      }
    } catch (error) {
      setSubmission({
        success: false,
        message: "Connection error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary relative overflow-hidden">
      {/* Matrix-style background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgb(34, 197, 94) 2px,
            rgb(34, 197, 94) 4px
          )`,
          }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-2">
            <Terminal className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
            <span className="text-sm sm:text-lg lg:text-xl font-mono font-bold text-primary hidden xs:block">
              TREASURE_IN_THE_SHELL
            </span>
            <span className="text-xs font-mono font-bold text-primary block xs:hidden">
              TREASURE
            </span>
          </div>
          <Badge
            variant="outline"
            className="text-primary border-primary text-xs sm:text-sm px-1 sm:px-2"
          >
            <Users className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
            <span className="hidden sm:inline">Live Event</span>
            <span className="sm:hidden">Live</span>
          </Badge>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-primary via-terminal-400 to-primary bg-clip-text text-transparent leading-tight">
            TREASURE IN THE SHELL
          </h1>
          <p className="text-sm sm:text-lg lg:text-2xl font-mono text-muted-foreground mb-4 sm:mb-6 px-2 leading-relaxed">
            CRACK THE CLUES • BREAK THE SHELL • CLAIM THE ROOT 💎🧑‍💻
          </p>
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-1 sm:gap-2 bg-card border border-border rounded-lg px-2 sm:px-4 py-1.5 sm:py-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-mono">02:00 PM</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-card border border-border rounded-lg px-2 sm:px-4 py-1.5 sm:py-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-mono">06 Aug 2025</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-card border border-border rounded-lg px-2 sm:px-4 py-1.5 sm:py-2">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              <span className="text-xs sm:text-sm font-mono">301 M Block</span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2 font-mono"
          >
            <Terminal className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />A
            Terminal Puzzle Challenge 🧠
          </Badge>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {/* Submission Form */}
          <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Trophy className="h-5 w-5" />
                Submit Your Progress
              </CardTitle>
              <CardDescription>
                Enter your team name and the password from your current level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-mono font-medium mb-2"
                  >
                    Team Name
                  </label>
                  <Input
                    id="teamName"
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    className="font-mono bg-input/50 border-border focus:border-primary text-base h-12"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-mono font-medium mb-2"
                  >
                    Level Password
                  </label>
                  <Input
                    id="password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Paste your level password here"
                    className="font-mono bg-input/50 border-border focus:border-primary text-base h-12"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || !teamName.trim() || !password.trim()
                  }
                  className="w-full font-mono bg-primary hover:bg-primary/90 h-12 text-base"
                >
                  {isSubmitting ? "SUBMITTING..." : "SUBMIT PROGRESS"}
                </Button>
              </form>

              {submission && (
                <div
                  className={`mt-4 p-4 rounded-lg font-mono text-sm ${
                    submission.success
                      ? "bg-primary/10 border border-primary/30 text-primary"
                      : "bg-destructive/10 border border-destructive/30 text-destructive"
                  }`}
                >
                  {submission.success && submission.level && (
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="h-4 w-4" />
                      <span className="font-bold">
                        LEVEL {submission.level} COMPLETED!
                      </span>
                    </div>
                  )}
                  <p>{submission.message}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Game Info */}
          <Card className="border-2 border-terminal-700/50 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-terminal-400">
                <Terminal className="h-5 w-5" />
                Challenge Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-mono font-semibold text-primary">
                  How It Works:
                </h3>
                <ul className="space-y-1 text-sm font-mono text-muted-foreground">
                  <li>• 10 levels of terminal puzzles await</li>
                  <li>• Each level gives you a unique password</li>
                  <li>• Levels are interconnected - complete them in order</li>
                  <li>
                    • Submit your highest level password to claim your rank
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono font-semibold text-primary">
                  Level System:
                </h3>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-2">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded border border-border bg-muted/30 text-xs font-mono"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-mono text-muted-foreground">
                  Complete challenges to unlock passwords for each level
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs font-mono text-muted-foreground">
                  💡 <strong>Pro Tip:</strong> Having Level 5 password means
                  you've conquered Levels 1-5!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-16 text-center">
          <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-card/30 rounded-lg border border-border">
            <Terminal className="h-3 w-3 sm:h-4 sm:w-4 text-primary animate-pulse" />
            <span className="font-mono text-xs sm:text-sm text-muted-foreground">
              <span className="hidden sm:inline">
                root@treasure:~$ ./start_challenge.sh
              </span>
              <span className="sm:hidden">./start_challenge.sh</span>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
