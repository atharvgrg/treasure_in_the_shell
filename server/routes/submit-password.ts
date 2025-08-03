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

// BULLETPROOF PASSWORD MAPPING - CANNOT BE CORRUPTED BY FORMATTING
const PASSWORDS = [
  { pass: "ZjLjTmM6FvvyRnrb2rfNWOZOTa6ip5If", level: 1 },
  { pass: "263JGJPfgU6LtdEvgfWU1XP5yac29mFx", level: 2 },
  { pass: "MNk8KNH3Usiio41PRUEoDFPqfxLPlSmx", level: 3 },
  { pass: "2WmrDFRmJIq3IPxneAaMGhap0pFhF3NJ", level: 4 },
  { pass: "4oQYVPkxZOOEOO5pTW81FB8j8lxXGUQw", level: 5 },
  { pass: "HWasnPhtq9AVKe0dmk45nxy20cvUa6EG", level: 6 },
  { pass: "morbNTDkSW6jIlUc0ymOdMaLnOlFVAaj", level: 7 },
  { pass: "dfwvzFQi4mU0wfNbFOe9RoWskMLg7eEc", level: 8 },
  { pass: "4CKMh1JI91bUIZZPXDqGanal4xvAg0JM", level: 9 },
  { pass: "FGUW5ilLVJrxX9kMYMmlN4MgbpfMiqey", level: 10 },
];

function getPasswordLevel(password: string): number | null {
  const found = PASSWORDS.find((p) => p.pass === password);
  return found ? found.level : null;
}

interface TeamSubmission {
  id: string;
  teamName: string;
  level: number;
  timestamp: Date;
  password: string;
}

interface TeamFeedback {
  id: string;
  teamName: string;
  level: number;
  rating: number;
  comments?: string;
  timestamp: Date;
  password: string;
}

// PERSISTENT DATA STORAGE
let teamSubmissions: TeamSubmission[] = [];
let teamFeedbacks: TeamFeedback[] = [];

export const handleSubmitPassword: RequestHandler = (req, res) => {
  console.log(`\n🚀 NEW SUBMISSION ATTEMPT`);

  try {
    const { teamName, password } = submitPasswordSchema.parse(req.body);
    console.log(`👤 Team: ${teamName}`);
    console.log(`🔑 Password: ${password.substring(0, 8)}...`);

    // VALIDATE PASSWORD
    const level = getPasswordLevel(password);
    if (!level) {
      console.log(`❌ INVALID PASSWORD from ${teamName}`);
      return res.json({
        success: false,
        message:
          "Invalid password. Please check your submission and try again.",
      });
    }

    // CREATE UNIQUE SUBMISSION
    const submissionId = `${teamName}_${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSubmission: TeamSubmission = {
      id: submissionId,
      teamName,
      level,
      timestamp: new Date(),
      password,
    };

    // ALWAYS ADD - NEVER REPLACE
    teamSubmissions.push(newSubmission);

    // SORT BY NEWEST FIRST
    teamSubmissions.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    console.log(`✅ STORED: ${teamName} → Level ${level}`);
    console.log(`📊 TOTAL ENTRIES: ${teamSubmissions.length}`);
    console.log(
      `📝 ALL TEAMS:`,
      teamSubmissions.map((s) => `${s.teamName}(L${s.level})`).join(", "),
    );

    const successMessages = [
      "Password accepted! Great work cracking the shell!",
      "Level unlocked! You're getting closer to the treasure!",
      "Excellent progress! The root access awaits!",
      "Outstanding! Your terminal skills are impressive!",
      "Breakthrough achieved! Keep pushing forward!",
    ];

    res.json({
      success: true,
      level,
      submissionId,
      message: `${successMessages[Math.floor(Math.random() * successMessages.length)]} Level ${level} completed.`,
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
  console.log(`\n📊 PROGRESS REQUEST`);
  console.log(`📈 Total stored entries: ${teamSubmissions.length}`);

  try {
    const progressData = teamSubmissions.map((submission) => ({
      id: submission.id,
      teamName: submission.teamName,
      level: submission.level,
      timestamp: submission.timestamp,
      hasPassword: true,
    }));

    console.log(`📤 SENDING ${progressData.length} entries to client`);
    console.log(
      `📋 ENTRIES:`,
      progressData.map((p) => `${p.teamName}-L${p.level}`).join(", "),
    );

    res.json({
      success: true,
      teams: progressData,
      total: progressData.length,
      serverTime: new Date().toISOString(),
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
  console.log(`\n⭐ NEW FEEDBACK ATTEMPT`);

  try {
    const { teamName, password, rating, comments } = submitFeedbackSchema.parse(
      req.body,
    );
    console.log(`👤 Team: ${teamName}, ⭐ Rating: ${rating}`);

    const level = getPasswordLevel(password);
    if (!level) {
      console.log(`❌ INVALID FEEDBACK PASSWORD from ${teamName}`);
      return res.json({
        success: false,
        message: "Invalid password. Please enter a valid level password.",
      });
    }

    // CREATE UNIQUE FEEDBACK
    const feedbackId = `${teamName}_${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFeedback: TeamFeedback = {
      id: feedbackId,
      teamName,
      level,
      rating,
      comments,
      timestamp: new Date(),
      password,
    };

    teamFeedbacks.push(newFeedback);
    teamFeedbacks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    console.log(
      `✅ FEEDBACK STORED: ${teamName} → ${rating}/5 stars for Level ${level}`,
    );
    console.log(`📊 TOTAL FEEDBACK: ${teamFeedbacks.length}`);

    res.json({
      success: true,
      feedbackId,
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
  console.log(`\n📊 FEEDBACK REQUEST`);
  console.log(`📈 Total feedback entries: ${teamFeedbacks.length}`);

  try {
    const feedbackData = teamFeedbacks.map((feedback) => ({
      id: feedback.id,
      teamName: feedback.teamName,
      level: feedback.level,
      rating: feedback.rating,
      comments: feedback.comments,
      timestamp: feedback.timestamp,
      hasPassword: true,
    }));

    console.log(`📤 SENDING ${feedbackData.length} feedback entries`);

    res.json({
      success: true,
      feedbacks: feedbackData,
      total: feedbackData.length,
      serverTime: new Date().toISOString(),
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
  const status = {
    submissions: {
      count: teamSubmissions.length,
      data: teamSubmissions.map((s) => ({
        id: s.id,
        teamName: s.teamName,
        level: s.level,
        timestamp: s.timestamp.toISOString(),
      })),
    },
    feedbacks: {
      count: teamFeedbacks.length,
      data: teamFeedbacks.map((f) => ({
        id: f.id,
        teamName: f.teamName,
        level: f.level,
        rating: f.rating,
        timestamp: f.timestamp.toISOString(),
      })),
    },
    serverTime: new Date().toISOString(),
  };

  console.log("📊 DATA STATUS:", status);
  res.json(status);
};

export const resetProgress: RequestHandler = (req, res) => {
  try {
    const beforeSubmissions = teamSubmissions.length;
    const beforeFeedbacks = teamFeedbacks.length;

    teamSubmissions.length = 0;
    teamFeedbacks.length = 0;

    console.log(
      `🗑️ RESET: Deleted ${beforeSubmissions} submissions and ${beforeFeedbacks} feedbacks`,
    );

    res.json({
      success: true,
      message: "All team progress and feedback has been successfully reset.",
      deleted: {
        submissions: beforeSubmissions,
        feedbacks: beforeFeedbacks,
      },
    });
  } catch (error) {
    console.error("❌ RESET ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Failed to reset progress.",
    });
  }
};
