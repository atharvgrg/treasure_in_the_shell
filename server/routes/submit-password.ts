import { RequestHandler } from "express";
import { z } from "zod";
import fs from "fs";
import path from "path";

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

// BULLETPROOF PASSWORD MAPPING
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
  timestamp: string;
  password: string;
}

interface TeamFeedback {
  id: string;
  teamName: string;
  level: number;
  rating: number;
  comments?: string;
  timestamp: string;
  password: string;
}

// FILE PATHS FOR PERSISTENT STORAGE
const DATA_DIR = path.join(process.cwd(), ".treasure-data");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");
const FEEDBACK_FILE = path.join(DATA_DIR, "feedback.json");

// ENSURE DATA DIRECTORY EXISTS
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log("📁 Created data directory:", DATA_DIR);
  }
}

// PERSISTENT FILE-BASED STORAGE FUNCTIONS
function loadSubmissions(): TeamSubmission[] {
  try {
    ensureDataDir();
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      const data = fs.readFileSync(SUBMISSIONS_FILE, "utf8");
      const submissions = JSON.parse(data) as TeamSubmission[];
      console.log(`📂 LOADED ${submissions.length} submissions from file`);
      return submissions;
    }
  } catch (error) {
    console.error("❌ Error loading submissions:", error);
  }
  console.log("📂 No existing submissions file, starting fresh");
  return [];
}

function saveSubmissions(submissions: TeamSubmission[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
    console.log(`💾 SAVED ${submissions.length} submissions to file`);
  } catch (error) {
    console.error("❌ Error saving submissions:", error);
    throw error;
  }
}

function loadFeedback(): TeamFeedback[] {
  try {
    ensureDataDir();
    if (fs.existsSync(FEEDBACK_FILE)) {
      const data = fs.readFileSync(FEEDBACK_FILE, "utf8");
      const feedback = JSON.parse(data) as TeamFeedback[];
      console.log(`📂 LOADED ${feedback.length} feedback entries from file`);
      return feedback;
    }
  } catch (error) {
    console.error("❌ Error loading feedback:", error);
  }
  console.log("📂 No existing feedback file, starting fresh");
  return [];
}

function saveFeedback(feedback: TeamFeedback[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(feedback, null, 2));
    console.log(`💾 SAVED ${feedback.length} feedback entries to file`);
  } catch (error) {
    console.error("❌ Error saving feedback:", error);
    throw error;
  }
}

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

    // LOAD EXISTING DATA
    const submissions = loadSubmissions();

    // CREATE UNIQUE SUBMISSION
    const submissionId = `${teamName}_${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSubmission: TeamSubmission = {
      id: submissionId,
      teamName,
      level,
      timestamp: new Date().toISOString(),
      password,
    };

    // ADD TO ARRAY
    submissions.push(newSubmission);

    // SORT BY NEWEST FIRST
    submissions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // SAVE TO FILE
    saveSubmissions(submissions);

    console.log(
      `✅ STORED: ${teamName} → Level ${level} (ID: ${submissionId})`,
    );
    console.log(`📊 TOTAL ENTRIES: ${submissions.length}`);
    console.log(
      `📝 ALL TEAMS:`,
      submissions.map((s) => `${s.teamName}(L${s.level})`).join(", "),
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
      totalSubmissions: submissions.length,
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

  try {
    // ALWAYS LOAD FRESH DATA FROM FILE
    const submissions = loadSubmissions();
    console.log(`📈 Total stored entries: ${submissions.length}`);

    const progressData = submissions.map((submission) => ({
      id: submission.id,
      teamName: submission.teamName,
      level: submission.level,
      timestamp: new Date(submission.timestamp),
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
      fileLocation: SUBMISSIONS_FILE,
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

    // LOAD EXISTING FEEDBACK
    const feedback = loadFeedback();

    // CREATE UNIQUE FEEDBACK
    const feedbackId = `${teamName}_${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newFeedback: TeamFeedback = {
      id: feedbackId,
      teamName,
      level,
      rating,
      comments,
      timestamp: new Date().toISOString(),
      password,
    };

    // ADD TO ARRAY
    feedback.push(newFeedback);
    feedback.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // SAVE TO FILE
    saveFeedback(feedback);

    console.log(
      `✅ FEEDBACK STORED: ${teamName} → ${rating}/5 stars for Level ${level} (ID: ${feedbackId})`,
    );
    console.log(`📊 TOTAL FEEDBACK: ${feedback.length}`);

    res.json({
      success: true,
      feedbackId,
      totalFeedback: feedback.length,
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

  try {
    // ALWAYS LOAD FRESH DATA FROM FILE
    const feedback = loadFeedback();
    console.log(`📈 Total feedback entries: ${feedback.length}`);

    const feedbackData = feedback.map((item) => ({
      id: item.id,
      teamName: item.teamName,
      level: item.level,
      rating: item.rating,
      comments: item.comments,
      timestamp: new Date(item.timestamp),
      hasPassword: true,
    }));

    console.log(`📤 SENDING ${feedbackData.length} feedback entries`);

    res.json({
      success: true,
      feedbacks: feedbackData,
      total: feedbackData.length,
      serverTime: new Date().toISOString(),
      fileLocation: FEEDBACK_FILE,
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
  try {
    const submissions = loadSubmissions();
    const feedback = loadFeedback();

    const status = {
      submissions: {
        count: submissions.length,
        fileExists: fs.existsSync(SUBMISSIONS_FILE),
        filePath: SUBMISSIONS_FILE,
        data: submissions.map((s) => ({
          id: s.id,
          teamName: s.teamName,
          level: s.level,
          timestamp: s.timestamp,
        })),
      },
      feedbacks: {
        count: feedback.length,
        fileExists: fs.existsSync(FEEDBACK_FILE),
        filePath: FEEDBACK_FILE,
        data: feedback.map((f) => ({
          id: f.id,
          teamName: f.teamName,
          level: f.level,
          rating: f.rating,
          timestamp: f.timestamp,
        })),
      },
      serverTime: new Date().toISOString(),
    };

    console.log("📊 DATA STATUS:", {
      submissions: status.submissions.count,
      feedback: status.feedbacks.count,
      files: {
        submissions: status.submissions.fileExists,
        feedback: status.feedbacks.fileExists,
      },
    });

    res.json(status);
  } catch (error) {
    console.error("❌ STATUS ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const resetProgress: RequestHandler = (req, res) => {
  try {
    const submissions = loadSubmissions();
    const feedback = loadFeedback();

    const beforeSubmissions = submissions.length;
    const beforeFeedbacks = feedback.length;

    // DELETE FILES
    if (fs.existsSync(SUBMISSIONS_FILE)) {
      fs.unlinkSync(SUBMISSIONS_FILE);
    }
    if (fs.existsSync(FEEDBACK_FILE)) {
      fs.unlinkSync(FEEDBACK_FILE);
    }

    console.log(
      `🗑️ RESET: Deleted ${beforeSubmissions} submissions and ${beforeFeedbacks} feedbacks`,
    );
    console.log(`🗑️ Files deleted: ${SUBMISSIONS_FILE}, ${FEEDBACK_FILE}`);

    res.json({
      success: true,
      message: "All team progress and feedback has been successfully reset.",
      deleted: {
        submissions: beforeSubmissions,
        feedbacks: beforeFeedbacks,
        files: [SUBMISSIONS_FILE, FEEDBACK_FILE],
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
