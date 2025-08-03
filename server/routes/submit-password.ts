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

// Password to level mapping - ALL KEYS MUST BE QUOTED STRINGS
const LEVEL_PASSWORDS: Record<string, number> = {
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
  console.log(`\n=== NEW SUBMISSION ===`);

  try {
    const { teamName, password } = submitPasswordSchema.parse(req.body);

    // Validate password exists in our level mapping
    const level = LEVEL_PASSWORDS[password];
    if (!level) {
      console.log(
        `❌ INVALID PASSWORD: ${password.substring(0, 10)}... from team: ${teamName}`,
      );
      return res.json({
        success: false,
        message:
          "Invalid password. Please check your submission and try again.",
      });
    }

    // Create unique ID for this submission
    const submissionId = `${teamName.toLowerCase()}_${level}_${Date.now()}`;

    // ALWAYS ADD NEW ENTRY - never update existing ones
    const newSubmission: TeamSubmission = {
      teamName,
      level,
      timestamp: new Date(),
      password,
    };

    teamSubmissions.push(newSubmission);

    // Sort by timestamp descending (newest first)
    teamSubmissions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    console.log(`✅ ADDED: ${teamName} completed level ${level}`);
    console.log(`📊 TOTAL ENTRIES: ${teamSubmissions.length}`);
    console.log(
      `📋 ALL SUBMISSIONS:`,
      teamSubmissions.map((s) => `${s.teamName}-L${s.level}`),
    );

    const messages = [
      "Password accepted! Great work cracking the shell!",
      "Level unlocked! You're getting closer to the treasure!",
      "Excellent progress! The root access awaits!",
      "Outstanding! Your terminal skills are impressive!",
      "Breakthrough achieved! Keep pushing forward!",
    ];

    res.json({
      success: true,
      level,
      message: `${messages[Math.floor(Math.random() * messages.length)]} Level ${level} completed.`,
    });
  } catch (error) {
    console.error("❌ SUBMISSION ERROR:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Please check your team name and password.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const getTeamProgress: RequestHandler = (req, res) => {
  console.log(
    `\n📊 PROGRESS REQUEST - Current entries: ${teamSubmissions.length}`,
  );

  try {
    const progressData = teamSubmissions.map((submission, index) => ({
      id: `${submission.teamName}_${submission.level}_${submission.timestamp.getTime()}`,
      teamName: submission.teamName,
      level: submission.level,
      timestamp: submission.timestamp,
      hasPassword: !!submission.password,
    }));

    console.log(`📤 SENDING ${progressData.length} progress entries`);
    console.log(
      `📋 ENTRIES:`,
      progressData.map((p) => `${p.teamName}-L${p.level}`),
    );

    res.json({
      success: true,
      teams: progressData,
      total: progressData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ GET PROGRESS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const submitFeedback: RequestHandler = (req, res) => {
  console.log(`\n=== NEW FEEDBACK ===`);

  try {
    const { teamName, password, rating, comments } = submitFeedbackSchema.parse(
      req.body,
    );

    // Validate password
    const level = LEVEL_PASSWORDS[password];
    if (!level) {
      console.log(`❌ INVALID FEEDBACK PASSWORD from team: ${teamName}`);
      return res.json({
        success: false,
        message: "Invalid password. Please enter a valid level password.",
      });
    }

    // ALWAYS ADD NEW FEEDBACK ENTRY
    const newFeedback: TeamFeedback = {
      teamName,
      level,
      rating,
      comments,
      timestamp: new Date(),
      password,
    };

    teamFeedbacks.push(newFeedback);

    // Sort by timestamp descending
    teamFeedbacks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(
      `✅ FEEDBACK ADDED: ${teamName} gave ${rating}/5 stars for level ${level}`,
    );
    console.log(`📊 TOTAL FEEDBACK ENTRIES: ${teamFeedbacks.length}`);
    console.log(
      `📋 ALL FEEDBACK:`,
      teamFeedbacks.map((f) => `${f.teamName}-L${f.level}-${f.rating}★`),
    );

    res.json({
      success: true,
      message:
        "Thank you for your feedback! Your input helps us improve the event.",
    });
  } catch (error) {
    console.error("❌ FEEDBACK ERROR:", error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid input. Please check all required fields.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export const getFeedback: RequestHandler = (req, res) => {
  console.log(
    `\n📊 FEEDBACK REQUEST - Current entries: ${teamFeedbacks.length}`,
  );

  try {
    const feedbackData = teamFeedbacks.map((feedback, index) => ({
      id: `${feedback.teamName}_${feedback.level}_${feedback.timestamp.getTime()}`,
      teamName: feedback.teamName,
      level: feedback.level,
      rating: feedback.rating,
      comments: feedback.comments,
      timestamp: feedback.timestamp,
      hasPassword: !!feedback.password,
    }));

    console.log(`📤 SENDING ${feedbackData.length} feedback entries`);
    console.log(
      `📋 ENTRIES:`,
      feedbackData.map((f) => `${f.teamName}-L${f.level}-${f.rating}★`),
    );

    res.json({
      success: true,
      feedbacks: feedbackData,
      total: feedbackData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ GET FEEDBACK ERROR:", error);
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
