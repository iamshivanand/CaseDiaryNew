const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

exports.generateAiDraft = functions.https.onRequest(async (req, res) => {
  // CORS configuration
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.set("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }

  try {
    // 1. Authenticate Authorization Header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized access. Token missing." });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 2. Read Request Parameters
    const { documentType, language, fields } = req.body;
    if (!documentType || !fields) {
      res.status(400).json({ error: "Missing required parameters (documentType, fields)." });
      return;
    }

    // 3. Verify User Credits in Firestore
    const userDocRef = admin.firestore().doc(`users/${uid}`);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      res.status(404).json({ error: "User profile not found. Please sync your account." });
      return;
    }

    const userData = userDoc.data();
    const currentCredits = userData.aiCredits !== undefined ? userData.aiCredits : 10; // Default to 10 free trial credits

    if (currentCredits < 5) {
      res.status(403).json({ error: "Insufficient AI credits. Please purchase top-up credits." });
      return;
    }

    // 4. Construct Gemini API Prompt
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      res.status(500).json({ error: "Gemini API key is not configured on the server." });
      return;
    }

    const isHindi = language === "hi";
    const promptText = `You are an expert litigating advocate in Indian courts. Draft a professional, legally binding ${documentType} in ${isHindi ? "Hindi" : "English"} language.
    
    Case Details:
    - Court Name: ${fields.courtName || "Hon'ble Court"}
    - Case Title: ${fields.caseTitle || (fields.clientName + " vs " + fields.oppositePartyName)}
    - Case Number/Year: ${fields.caseNumber || "____"}/${fields.caseYear || "2026"}
    
    Advocate Profile:
    - Advocate Name: ${fields.advocateName}
    - Enrollment Number: ${fields.advocateEnrollment || "Not Specified"}
    - Office/Chamber Address: ${fields.advocateAddress || "Not Specified"}
    
    Input Parameters & Facts:
    ${JSON.stringify(fields, null, 2)}
    
    Requirements:
    1. The output must be returned as a valid JSON object containing exactly two keys: "text" and "html".
    2. "text": Must contain a standard plain text layout of the document with clean indentation, proper spacing, uppercase section headers, and signatures (for a text-only preview).
    3. "html": Must contain a print-ready, well-formatted HTML document with 1.5-inch page margins, justified paragraphs, underline headings, double-spaced lines, and standard signing tables (designed to print perfectly on standard legal ledger sizing paper).
    
    Return ONLY a single valid JSON object containing the "text" and "html" keys. Do not prepend or append any markdown text or explanations.`;

    // 5. Call Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
    
    const geminiResponse = await axios.post(geminiUrl, {
      contents: [{
        parts: [{ text: promptText }]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const candidateText = geminiResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("Empty response received from Gemini.");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(candidateText.trim());
    } catch (parseErr) {
      console.warn("Failed to parse Gemini output as JSON, attempting manual extraction:", candidateText);
      parsedResponse = {
        text: candidateText,
        html: `<html><body><pre style="white-space: pre-wrap;">${candidateText}</pre></body></html>`
      };
    }

    // 6. Deduct credits from user profile
    await userDocRef.update({
      aiCredits: currentCredits - 5
    });

    // 7. Return Result
    res.status(200).json({
      text: parsedResponse.text,
      html: parsedResponse.html,
      remainingCredits: currentCredits - 5
    });

  } catch (err) {
    console.error("Cloud function generation error:", err);
    res.status(500).json({ error: err.message || "Internal server error during document drafting." });
  }
});
