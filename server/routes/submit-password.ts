import { RequestHandler } from "express";
import { z } from "zod";

const submitPasswordSchema = z.object({
  teamName: z.string().min(1).max(50),
  password: z.string().min(1),
});

const submitFeedbackSchema = z.object({
  teamName: z.string().min(1).max(50),
  password: z.string().min(1),
  rating: z.number().min(1).max(5),
  comments: z.string().optional(),
});

// Password to level mapping
const LEVEL_PASSWORDS = {
  "ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If": 1,
  "263JGJPfgU6LtdEvgfWU1XP5yac29mFx": 2,
  "MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx": 3,
  "2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ": 4,
  "4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw": 5,
  "HWasnPhtq9AVKe0dmk45nxy20cvUa6EG": 6,
  "morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj": 7,
  "dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc": 8,
  "4CKMh1JI91bUIZZPXDqGanal4xvAg0JM": 9,
  "FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey": 10,
};

interface TeamSubmission {
  teamName: string;
  level: number;
  timestamp: Date;
  password: string;
}

interface TeamFeedback {
  teamName: string;
  level: number;
  rating: number;
  comments?: string;
  timestamp: Date;
  password: string;
}

// In-memory storage (in production, use a proper database)
let teamSubmissions: TeamSubmission[] = [];
let teamFeedbacks: TeamFeedback[] = [];

export const handleSubmitPassword: RequestHandler = (req, res) => {
  try {
    const { teamName, password } = submitPasswordSchema.parse(req.body);

    // Find the level for this password
    const level = LEVEL_PASSWORDS[password as keyof typeof LEVEL_PASSWORDS];

    if (!level) {
      console.log(`Invalid password attempt by team: ${teamName}`);
      return res.json({
        success: false,
        message: "Invalid password. Please check your submission and try again.",
      });
    }

    // Check if team already submitted this level or higher
    const existingSubmission = teamSubmissions.find(
      (s) => s.teamName.toLowerCase() === teamName.toLowerCase(),
    );

    if (existingSubmission && existingSubmission.level >= level) {
      console.log(`Team ${teamName} attempted level ${level} but already has level ${existingSubmission.level}`);
      return res.json({
        success: false,
        message: `Team "${teamName}" has already completed Level ${existingSubmission.level} or higher.`,
      });
    }

    // Update or create team submission
    if (existingSubmission) {
      console.log(`${teamName} advanced from level ${existingSubmission.level} to ${level}`);
      existingSubmission.level = level;
      existingSubmission.timestamp = new Date();
      existingSubmission.password = password;
    } else {
      console.log(`New team ${teamName} completed level ${level}`);
      teamSubmissions.push({
        teamName,
        level,
        timestamp: new Date(),
        password,
      });
    }

    // Sort by level descending for leaderboard
    teamSubmissions.sort(
      (a, b) =>
        b.level - a.level || a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const messages = [
      "Password accepted! Great work cracking the shell!",
      "Level unlocked! You're getting closer to the treasure!",
      "Excellent progress! The root access awaits!",
      "Outstanding! Your terminal skills are impressive!",
      "Breakthrough achieved! Keep pushing forward!",
    ];

    const response = {
      success: true,
      level,
      message: `${messages[Math.floor(Math.random() * messages.length)]} Level ${level} completed.`,
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Password submission validation error:", error.errors);
      return res.status(400).json({
        success: false,
        message: "Invalid input. Please check your team name and password.",
      });
    }

    console.error("Submit password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const getTeamProgress: RequestHandler = (req, res) => {
  try {
    const progressData = teamSubmissions.map((submission) => ({
      teamName: submission.teamName,
      level: submission.level,
      timestamp: submission.timestamp,
      // Don't expose actual passwords in the response
      hasPassword: !!submission.password,
    }));

    res.json({
      success: true,
      teams: progressData,
    });
  } catch (error) {
    console.error("Get team progress error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const submitFeedback: RequestHandler = (req, res) => {
  console.log("=== FEEDBACK SUBMISSION REQUEST ===");
  console.log("Request body:", req.body);
  console.log("Current team feedbacks count:", teamFeedbacks.length);

  try {
    const { teamName, password, rating, comments } = submitFeedbackSchema.parse(
      req.body,
    );
    console.log("Parsed feedback data:", { teamName, rating, comments, password: password.substring(0, 10) + "..." });

    // Find the level for this password
    const level = LEVEL_PASSWORDS[password as keyof typeof LEVEL_PASSWORDS];
    console.log("Feedback password lookup - Level:", level);

    if (!level) {
      console.log("Invalid password provided for feedback");
      return res.json({
        success: false,
        message: "Invalid password. Please enter a valid level password.",
      });
    }

    // Check if team already submitted feedback
    const existingFeedback = teamFeedbacks.find(
      (f) => f.teamName.toLowerCase() === teamName.toLowerCase(),
    );
    console.log("Existing feedback check:", existingFeedback ? `Found rating ${existingFeedback.rating}` : "None found");

    if (existingFeedback) {
      console.log(`Updating existing feedback for ${teamName}`);
      // Update existing feedback
      existingFeedback.level = level;
      existingFeedback.rating = rating;
      existingFeedback.comments = comments;
      existingFeedback.timestamp = new Date();
      existingFeedback.password = password;
    } else {
      console.log(`Creating new feedback for ${teamName}`);
      // Create new feedback
      teamFeedbacks.push({
        teamName,
        level,
        rating,
        comments,
        timestamp: new Date(),
        password,
      });
    }

    // Sort by timestamp descending
    teamFeedbacks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log("Updated team feedbacks count:", teamFeedbacks.length);
    console.log("Team feedbacks:", teamFeedbacks.map(f => ({ name: f.teamName, rating: f.rating, level: f.level })));

    const response = {
      success: true,
      message: "Thank you for your feedback! Your input helps us improve the event.",
    };

    console.log("Sending feedback success response:", response);
    res.json(response);
  } catch (error) {
    console.error("=== FEEDBACK SUBMISSION ERROR ===");

    if (error instanceof z.ZodError) {
      console.error("Feedback validation error:", error.errors);
      return res.status(400).json({
        success: false,
        message: "Invalid input. Please check all required fields.",
      });
    }

    console.error("Submit feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const getFeedback: RequestHandler = (req, res) => {
  try {
    const feedbackData = teamFeedbacks.map((feedback) => ({
      teamName: feedback.teamName,
      level: feedback.level,
      rating: feedback.rating,
      comments: feedback.comments,
      timestamp: feedback.timestamp,
      // Don't expose actual passwords in the response
      hasPassword: !!feedback.password,
    }));

    res.json({
      success: true,
      feedbacks: feedbackData,
    });
  } catch (error) {
    console.error("Get feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const resetProgress: RequestHandler = (req, res) => {
  try {
    // Clear all team submissions and feedbacks
    teamSubmissions.length = 0;
    teamFeedbacks.length = 0;

    console.log("All team progress and feedback has been reset");

    res.json({
      success: true,
      message: "All team progress and feedback has been successfully reset.",
    });
  } catch (error) {
    console.error("Reset progress error:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Failed to reset progress.",
    });
  }
};
