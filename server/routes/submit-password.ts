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
  ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If: 1,
  "263JGJPfgU6LtdEvgfWU1XP5yac29mFx": 2,
  MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx: 3,
  "2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ": 4,
  "4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw": 5,
  HWasnPhtq9AVKe0dmk45nxy20cvUa6EG: 6,
  morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj: 7,
  dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc: 8,
  "4CKMh1JI91bUIZZPXDqGanal4xvAg0JM": 9,
  FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey: 10,
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
  console.log(`\n=== PASSWORD SUBMISSION START ===`);
  console.log(`Total submissions before: ${teamSubmissions.length}`);

  try {
    const { teamName, password } = submitPasswordSchema.parse(req.body);
    console.log(`Team: ${teamName}, Password: ${password.substring(0, 8)}...`);

    // Find the level for this password
    const level = LEVEL_PASSWORDS[password as keyof typeof LEVEL_PASSWORDS];

    if (!level) {
      console.log(`Invalid password attempt by team: ${teamName}`);
      return res.json({
        success: false,
        message:
          "Invalid password. Please check your submission and try again.",
      });
    }

    // Check if this exact team+level combination already exists
    const existingSubmission = teamSubmissions.find(
      (s) =>
        s.teamName.toLowerCase() === teamName.toLowerCase() &&
        s.level === level,
    );

    if (existingSubmission) {
      console.log(
        `Team ${teamName} already submitted level ${level}, updating timestamp`,
      );
      existingSubmission.timestamp = new Date();
      existingSubmission.password = password;
    } else {
      console.log(
        `Team ${teamName} completed level ${level} - adding new entry`,
      );
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

    console.log(`Total submissions after: ${teamSubmissions.length}`);
    console.log(
      `All current submissions:`,
      teamSubmissions.map((s) => ({
        team: s.teamName,
        level: s.level,
        time: s.timestamp.toISOString(),
      })),
    );
    console.log(`=== PASSWORD SUBMISSION END ===\n`);

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
  console.log(`\n=== FEEDBACK SUBMISSION START ===`);
  console.log(`Total feedbacks before: ${teamFeedbacks.length}`);

  try {
    const { teamName, password, rating, comments } = submitFeedbackSchema.parse(
      req.body,
    );
    console.log(
      `Team: ${teamName}, Rating: ${rating}, Level password: ${password.substring(0, 8)}...`,
    );

    // Find the level for this password
    const level = LEVEL_PASSWORDS[password as keyof typeof LEVEL_PASSWORDS];

    if (!level) {
      console.log(`Invalid password in feedback from team: ${teamName}`);
      return res.json({
        success: false,
        message: "Invalid password. Please enter a valid level password.",
      });
    }

    // Check if this exact team+level feedback already exists
    const existingFeedback = teamFeedbacks.find(
      (f) =>
        f.teamName.toLowerCase() === teamName.toLowerCase() &&
        f.level === level,
    );

    if (existingFeedback) {
      console.log(
        `${teamName} updated feedback: ${rating}/5 stars for level ${level}`,
      );
      // Update existing feedback for same level
      existingFeedback.rating = rating;
      existingFeedback.comments = comments;
      existingFeedback.timestamp = new Date();
      existingFeedback.password = password;
    } else {
      console.log(
        `${teamName} submitted NEW feedback: ${rating}/5 stars for level ${level}`,
      );
      // Create new feedback entry
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

    console.log(`Total feedbacks after: ${teamFeedbacks.length}`);
    console.log(
      `All current feedbacks:`,
      teamFeedbacks.map((f) => ({
        team: f.teamName,
        level: f.level,
        rating: f.rating,
        time: f.timestamp.toISOString(),
      })),
    );
    console.log(`=== FEEDBACK SUBMISSION END ===\n`);

    res.json({
      success: true,
      message:
        "Thank you for your feedback! Your input helps us improve the event.",
    });
  } catch (error) {
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

export const getDataStatus: RequestHandler = (req, res) => {
  console.log("=== DATA STATUS REQUEST ===");

  const status = {
    submissions: {
      count: teamSubmissions.length,
      data: teamSubmissions.map((s) => ({
        teamName: s.teamName,
        level: s.level,
        timestamp: s.timestamp.toISOString(),
      })),
    },
    feedbacks: {
      count: teamFeedbacks.length,
      data: teamFeedbacks.map((f) => ({
        teamName: f.teamName,
        level: f.level,
        rating: f.rating,
        timestamp: f.timestamp.toISOString(),
      })),
    },
    timestamp: new Date().toISOString(),
  };

  console.log("Current data status:", status);
  res.json(status);
};

export const resetProgress: RequestHandler = (req, res) => {
  try {
    console.log(
      `Resetting ${teamSubmissions.length} submissions and ${teamFeedbacks.length} feedbacks`,
    );

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
