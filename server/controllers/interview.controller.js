import fs from "fs";
import { PDFParse } from "pdf-parse";
import { askAi } from "../services/openRouter.services.js";
import Interview from "../models/interview.model.js";
import User from "../models/user.model.js";

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume required" });
    }
    const filePath = req.file.path;

    const fileBuffer = await fs.promises.readFile(filePath);

    const data = await pdfParse(fileBuffer);

    let resumeText = data.text;

    resumeText = resumeText.replace(/\s+/g, " ").trim();

    const messages = [
      {
        role: "system",
        content: `
Extract structured data from resume.

Return strictly JSON:

{
  "role": "string",
  "experience": "string",
  "projects": ["project1", "project2"],
  "skills": ["skill1", "skill2"]
}
    `,
      },
      {
        role: "user",
        content: resumeText,
      },
    ];

    const aiResponse = await askAi(messages);
    const cleanedResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const parsed = JSON.parse(cleanedResponse);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      role: parsed.role,
      experience: parsed.experience,
      projects: parsed.projects,
      skills: parsed.skills,
      resumeText,
    });
  } catch (error) {
    console.log(error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({ message: error.message });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    let { role, experience, mode, resumeText, projects, skills } = req.body;

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res.status(400).json({
        message: "Role, Experience, and Mode are required",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(400).json({
        message: "Users not found",
      });
    }

    if (user.credits < 1) {
      return res.status(400).json({
        message: "Not enough credits. Minimum 50 required",
      });
    }

    const projectText =
      Array.isArray(projects) && projects.length ? projects.join(", ") : "None";

    const skillsText =
      Array.isArray(skills) && skills.length ? skills.join(", ") : "None";

    const safeResume = resumeText?.trim() || "None";

    const userPrompt = `
      Role:${role},
      Experience:${experience},
      InterviewMode:${mode}
      Projects:${projectText}
      Skills:${skillsText}
      Resume:${safeResume}
     `;

    if (!userPrompt.trim()) {
      return res.status(400).json({
        message: "Prompt content is empty",
      });
    }

    const messages = [
      {
        role: "system",
        content: `
You are a real human interviewer conducting a professional interview.

Speak in simple, natural English as if you are directly talking to the
candidate.

Generate exactly 5 interview questions.

Strict Rules:
- Each question must contain between 15 and 25 words.
- Each question must be a single complete sentence.
- Do NOT number them.
- Do NOT add explanations.
- Do NOT add extra text before or after.
- One question per line only.
- Keep language simple and conversational.
- Questions must feel practical and realistic.

Difficulty progression:
Question 1 → easy
Question 2 → easy
Question 3 → medium
Question 4 → medium
Question 5 → hard

Make questions based on the candidate's role, 
experience,interviewMode, projects, skills
and resume details.
`,
      },

      {
        role: "user",
        content: userPrompt,
      },
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({
        message: "AI returned empty response",
      });
    }

    const questionArray = aiResponse
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 5);

    if (questionArray.length === 0) {
      return res.status(500).json({
        messages: "AI failed to generate questions",
      });
    }

    user.credits -= 1;
    await user.save();

    const interview = await Interview.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      })),
    });

    return res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: `failed to create interview ${error}`,
    });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;

    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const question = interview.questions[questionIndex];

    if (!question) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    // If no answer was provided
    if (!answer || !answer.trim()) {
      question.answer = "";
      question.score = 0;
      question.finalScore = 0;
      question.confidence = 0;
      question.communication = 0;
      question.correctness = 0;
      question.feedback = "You did not submit an answer.";

      await interview.save();

      return res.status(200).json({
        feedback: question.feedback,
        score: question.score,
        confidence: question.confidence,
        communication: question.communication,
        correctness: question.correctness,
      });
    }

    // If time exceeded
    if (timeTaken > question.timeLimit) {
      question.answer = answer.trim();
      question.score = 0;
      question.finalScore = 0;
      question.confidence = 0;
      question.communication = 0;
      question.correctness = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";

      await interview.save();

      return res.status(200).json({
        feedback: question.feedback,
        score: question.score,
        confidence: question.confidence,
        communication: question.communication,
        correctness: question.correctness,
      });
    }

    const messages = [
      {
        role: "system",
        content: `
You are a professional technical interviewer.

Evaluate the candidate's answer and return ONLY valid JSON in exactly this format:

{
  "confidence": 85,
  "communication": 90,
  "correctness": 88,
  "finalScore": 88,
  "feedback": "Excellent answer with clear explanation."
}

Rules:
- confidence: number between 0 and 100
- communication: number between 0 and 100
- correctness: number between 0 and 100
- finalScore: overall score between 0 and 100
- feedback: concise professional feedback
- Return ONLY JSON with no markdown or extra text
`,
      },
      {
        role: "user",
        content: `
Question: ${question.question}
Answer: ${answer.trim()}
`,
      },
    ];

    const aiResponse = await askAi(messages);

    console.log("Raw AI Response:", aiResponse);

    let parsed;

    try {
      parsed = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);

      // Fallback scores if AI response is not valid JSON
      parsed = {
        confidence: 70,
        communication: 70,
        correctness: 70,
        finalScore: 70,
        feedback:
          "Good answer. The response was evaluated using fallback scoring.",
      };
    }

    // Save all values safely
    question.answer = answer.trim();
    question.confidence = Number(parsed.confidence) || 0;
    question.communication = Number(parsed.communication) || 0;
    question.correctness = Number(parsed.correctness) || 0;
    question.score =
      Number(parsed.finalScore) ||
      Math.round(
        ((Number(parsed.confidence) || 0) +
          (Number(parsed.communication) || 0) +
          (Number(parsed.correctness) || 0)) /
          3,
      );
    question.feedback = parsed.feedback || "Answer evaluated successfully.";

    // Important: mark nested object as modified
    interview.markModified("questions");

    await interview.save();

    console.log("Saved Question:", question);

    return res.status(200).json({
      feedback: question.feedback,
      score: question.score,
      confidence: question.confidence,
      communication: question.communication,
      correctness: question.correctness,
    });
  } catch (error) {
    console.error("submitAnswer error:", error);

    return res.status(500).json({
      message: `Failed to submit answer: ${error.message}`,
    });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      return res.status(400).json({
        message: "failed to find Interview",
      });
    }

    console.log(JSON.stringify(interview.questions, null, 2));

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;

    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || "",
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: `Failed to finish interview ${error}`,
    });
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.userId })
      .sort({ creditAt: -1 })
      .select("role experience mode finalScore status createdAt");

    return res.status(200).json(interviews);
  } catch (error) {
    return res.status(500).json({
      message: `failed to find currentUser Interview ${error}`,
    });
  }
};

export const getMyInterviewReport = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        message: "Interview not found",
      });
    }

    const totalQuestions = interview.questions.length;
    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;

      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;

    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    return res.json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions,
    });
  } catch (error) {
    return res.status(500).json({
      message: `failed to find currentUser Interview report ${error}`,
    });
  }
};
