// Load external libraries (handled in HTML with Tesseract.js, compromise.js)

// Define showResult globally for early access
function showResult(message, className = "neutral") {
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = `<p class="${
    className === "neutral" ? "" : className
  }">${message}</p>`;
  resultDiv.style.display = "block";
  resultDiv.classList.remove("hidden");
  resultDiv.classList.add("result");
}

// Helper function to escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape all regex special characters
}

// Server URL for communication with the back-end
const SERVER_URL = "https://scam-email-checker-server.herokuapp.com"; // Updated to Heroku URL

// Toggle feedback section (moved outside DOMContentLoaded for global access)
function toggleFeedback() {
  const feedbackSection = document.getElementById("feedbackSection");
  if (!feedbackSection) {
    console.error("Feedback section not found in DOM.");
    return;
  }
  feedbackSection.style.display =
    feedbackSection.style.display === "none" ? "block" : "none";
  feedbackSection.classList.add("feedback-section");
}

// Wait for DOM content to load with additional verification
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("scamCheckerForm");
  const emailContent = document.getElementById("emailContent");
  const emailId = document.getElementById("emailId");
  const checkButton = document.querySelector("button");
  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");
  let progressBar = document.getElementById("progressBar"); // Changed to `let` for potential reassignment
  let progressFill = document.getElementById("progressFill"); // Changed to `let` for potential reassignment
  const feedbackSection = document.getElementById("feedbackSection");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const feedbackEmail = document.getElementById("feedbackEmail");
  const feedbackText = document.getElementById("feedbackText");
  const sendFeedback = document.getElementById("sendFeedback");
  const feedbackStatus = document.getElementById("feedbackStatus");

  // Check if libraries are loaded
  function checkLibrariesLoaded() {
    if (typeof Tesseract === "undefined" || typeof nlp === "undefined") {
      console.error(
        "Tesseract.js or compromise.js failed to load. Please ensure internet connectivity and CDN availability."
      );
      showResult(
        "Error: Required libraries failed to load. Please check your internet connection or try again later.",
        "neutral"
      );
      return false;
    }
    console.log("Tesseract.js and compromise.js loaded successfully.");
    return true;
  }

  if (!checkLibrariesLoaded()) return;

  // Verify progress bar elements exist on DOM load
  console.log("DOM loaded. Progress bar elements:", {
    progressBar,
    progressFill,
  });

  // Show progress bar during analysis with enhanced debugging
  function showProgress(percentage = 0, riskScore = null) {
    // Get or create the progress bar elements
    let progressBar = document.getElementById("progressBar");
    let progressFill = document.getElementById("progressFill");

    console.log("Attempting to show progress bar:", {
      progressBarExists: !!progressBar,
      progressFillExists: !!progressFill,
    });

    if (!progressBar || !progressFill) {
      console.warn(
        'Progress bar elements not found in DOM. Creating them dynamically...'
      );
      const resultDiv = document.getElementById("result");
      if (!resultDiv) {
        console.error("Result div not found in DOM. Aborting.");
        return;
      }

      // Create and append progress bar elements if they don’t exist
      const riskBar = document.createElement("div");
      riskBar.className = "risk-bar";

      const progressBarElement = document.createElement("div");
      progressBarElement.id = "progressBar";
      progressBarElement.className = "progress-bar";

      const progressFillElement = document.createElement("div");
      progressFillElement.id = "progressFill";
      progressFillElement.className = "progress-fill analyzing";

      progressBarElement.appendChild(progressFillElement);
      riskBar.appendChild(progressBarElement);
      resultDiv.insertBefore(riskBar, resultDiv.firstChild); // Insert at the top of #result

      progressBar = progressBarElement;
      progressFill = progressFillElement;
    }

    progressBar.style.display = "block";
    if (riskScore !== null) {
      progressFill.style.width = `${riskScore}%`;
      progressFill.textContent = `${riskScore}%`;
      progressFill.className = "progress-fill"; // Reset all classes
      if (riskScore < 30) {
        progressFill.classList.add("low-risk");
      } else if (riskScore < 50) {
        progressFill.classList.add("medium-risk");
      } else {
        progressFill.classList.add("high-risk");
      }
    } else {
      progressFill.style.width = `${percentage}%`;
      progressFill.textContent = `${percentage}%`;
      progressFill.className = "progress-fill analyzing"; // Blue for analyzing
    }
  }

  // Handle text input submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = emailContent.value.trim();
    const emailInput = emailId.value.trim();

    if (!input && !emailInput) {
      showResult("Please enter text, an email, or a URL to check.", "neutral");
      return;
    }

    // Validate input length to prevent performance issues
    if (input.length > 5000 || (emailInput && emailInput.length > 255)) {
      showResult(
        "Input too large. Please limit text to 5000 characters and email to 255 characters.",
        "neutral"
      );
      return;
    }

    checkButton.disabled = true;
    checkButton.innerHTML = 'Checking Email <div class="loading"></div>';
    console.log("Starting text analysis, showing progress bar...");
    showProgress(0); // Initial call to create or show the progress bar

    try {
      // Simulate progress (0% → 100%)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        showProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
          // After reaching 100%, reset to 0% briefly, then show final risk score
          setTimeout(() => {
            const analysis = analyzeScam(input, emailInput);
            analysis
              .then((result) => {
                console.log(
                  "Showing final risk score in progress bar:",
                  result.riskScore
                );
                showProgress(0, result.riskScore); // Reset to 0% briefly, then show final risk score
                displayResults(result);
              })
              .catch((error) => {
                console.error("Analysis error:", error);
                showProgress(100);
                showResult(
                  `Error checking for scams: ${
                    error.message ||
                    "Please try again or visit digitalscamalert.com for help."
                  }`,
                  "neutral"
                );
              });
          }, 100); // Brief delay to reset to 0% before showing final score
        }
      }, 200);
    } catch (error) {
      console.error("Analysis error:", error);
      showProgress(100);
      showResult(
        `Error checking for scams: ${
          error.message ||
          "Please try again or visit digitalscamalert.com for help."
        }`,
        "neutral"
      );
    } finally {
      checkButton.disabled = false;
      checkButton.innerHTML = "Check for Scams";
    }
  });

  // Real-time validation and highlighting for text input
  emailContent.addEventListener("input", () => {
    highlightKeywordsInTextarea(emailContent.value);
  });

  // Handle image upload with debugging, loading message, progress, and error handling
  imageUpload.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);
    if (!file || !file.type.startsWith("image/")) {
      console.error("Invalid file type or no file selected.");
      showResult("Please upload a valid image (PNG or JPEG).", "neutral");
      return;
    }

    if (file.size > 500000) {
      // 500KB limit
      showResult(
        "Image too large. Please use a file smaller than 500KB.",
        "neutral"
      );
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target.result;
      imagePreview.innerHTML = "";
      imagePreview.appendChild(img);
    };
    reader.readAsDataURL(file);

    // Extract text using Tesseract.js with debugging and progress
    checkButton.disabled = true;
    checkButton.innerHTML = 'Extracting text, please wait, be patient <div class="loading"></div>';
    console.log("Starting image extraction, showing progress bar...");
    showProgress(0); // Initial call to create or show the progress bar

    try {
      let progress = 0;
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          console.log("Tesseract progress:", m);
          if (m.progress !== undefined) {
            progress = Math.round(m.progress * 100);
            showProgress(progress); // Update progress during OCR
          }
        },
      });

      console.log(
        "Extracted text:",
        result.data.text,
        "Detected language:",
        result.data.lang
      );

      // Clean and trim extracted text
      const cleanedText = result.data.text
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.!?,]/g, ""); // Normalize punctuation
      if (!cleanedText || cleanedText.length < 5) {
        throw new Error(
          "No or insufficient text detected. Please try a clearer image or a smaller file."
        );
      }

      // Detect platform text
      const platform = detectSocialPlatform(cleanedText);
      emailContent.value = cleanedText;

      // Analyze the extracted text
      const analysis = await analyzeScam(cleanedText, null, platform);
      console.log(
        "Showing final risk score in progress bar:",
        analysis.riskScore
      );
      showProgress(0, analysis.riskScore); // Reset to 0% briefly, then show final risk score
      displayResults(analysis, result.data.lang || "eng");
    } catch (error) {
      console.error("Tesseract/OCR or analysis error:", error);
      showProgress(100); // Show 100% on error
      showResult(
        `Error analyzing extracted text: ${
          error.message ||
          "Please try a clearer image, a smaller file, or check your internet connection. Visit digitalscamalert.com for support."
        }`,
        "neutral"
      );
    } finally {
      checkButton.disabled = false;
      checkButton.innerHTML = "Check for Scams";
    }
  });

  // Highlight keywords/phrases in textarea in real-time
  function highlightKeywordsInTextarea(content) {
    const suspiciousKeywords = [
      "urgent",
      "verify",
      "account",
      "password",
      "login",
      "click here",
      "limited time",
      "congratulations",
      "winner",
      "prize",
      "suspicious activity",
      "immediately",
      "voice cloning",
      "deepfake",
      "Nepal bank",
      "mobile recharge",
      "crypto wallet",
      "free money",
      "win lottery",
      "bank transfer",
      "security alert",
      "update now",
      "confirm details",
      "access denied",
      "blocked account",
      "payment pending",
      "urgent action",
      "immediate response",
      "act fast",
      "exclusive offer",
      "special deal",
      "cash prize",
      "gift card",
      "free trial",
      "unclaimed funds",
      "inheritance",
      "investment opportunity",
      "high returns",
      "guaranteed profit",
      "risk-free",
      "bitcoin scam",
      "crypto giveaway",
      "token sale",
      "wallet hack",
      "phishing link",
      "malware download",
      "virus warning",
      "system error",
      "account locked",
      "identity theft",
      "credit card fraud",
      "personal data",
      "sensitive information",
      "verify identity",
      "social security",
      "tax refund",
      "government grant",
      "police notice",
      "court order",
      "legal action",
      "arrest warrant",
      "emergency funds",
      "family emergency",
      "hospital bill",
      "kidnapping scam",
      "grandparent scam",
      "CEO fraud",
      "invoice scam",
      "delivery failed",
      "package tracking",
      "customs clearance",
      "Nepal police",
      "bank of Nepal",
      "mobile top-up",
      "recharge offer",
      "SIM card scam",
      "data breach",
      "hacked account",
      "password reset",
      "two-factor auth",
      "unauthorized access",
      "suspicious login",
      "account suspension",
      "verification code",
      "one-time password",
      "OTP scam",
      "fake invoice",
      "charity fraud",
      "donation request",
      "fundraising scam",
      "AI-generated",
      "deepfake video",
      "voice impersonation",
      "synthetic voice",
      "AI chatbot",
      "fake customer service",
      "technical support",
      "refund processing",
      "overpayment scam",
      "money mule",
      "wire transfer",
      "bank draft",
      "cash app",
      "PayPal scam",
      "eBay fraud",
      "Amazon scam",
      "UPS delivery",
      "FedEx alert",
      "DHL notice",
      "tracking number",
      "package scam",
      "Nepal telecom",
      "Ncell scam",
      "appointed",
      "job",
      "offer",
      // African inheritance scam-specific keywords
      "Africa",
      "African",
      "Central African Republic",
      "Bangui",
      "Estate",
      "deceased",
      "client",
      "legal counsel",
      "administrator",
      "valued assets",
      "heir",
      "partner",
      "inheritance",
      "succession",
      "reply urgently",
      // New keywords (from recent updates)
      "romance",
      "love",
      "soulmate",
      "dating",
      "girlfriend",
      "boyfriend",
      "lonely", // Romance scams
      "tech support",
      "virus detected",
      "remote access",
      "fix now",
      "call this number", // Tech support scams
      "survey",
      "feedback reward",
      "complete this",
      "earn cash",
      "quick money", // Fake surveys
      "voucher",
      "coupon",
      "discount code",
      "redeem now",
      "exclusive gift", // Fake offers
      "celebrity",
      "endorsement",
      "sponsored",
      "meet me",
      "live chat", // Celebrity scams
      "rental",
      "deposit",
      "landlord",
      "property",
      "lease agreement", // Rental scams
      "puppy",
      "pet adoption",
      "kitten",
      "shipping fee",
      "animal rescue", // Pet scams
      "IRS",
      "tax penalty",
      "audit notice",
      "pay taxes",
      "revenue service", // Tax/IRS scams
      "student loan",
      "debt relief",
      "forgiveness",
      "enroll now",
      "financial aid", // Student loan scams
      "visa",
      "immigration",
      "green card",
      "citizenship",
      "application fee", // Immigration scams
      "update account",
      "update payment",
      "auto debit",
      "approval notice",
      "chamber of commerce",
      "accredited investor",
      "security alert",
      "+1 8889298873", // Phone number (handled by escapeRegExp)
    ];

    const suspiciousPhrases = [
      "click here to verify your account",
      "urgent action required now",
      "your account has been compromised",
      "win a free prize today",
      "limited time offer expires",
      "immediate response needed",
      "confirm your identity to avoid suspension",
      "crypto investment opportunity",
      "Nepal bank urgent verification",
      "mobile recharge offer expired",
      "AI-generated voice message",
      "deepfake video proof",
      "suspicious activity detected",
      "act fast to claim your prize",
      "government grant notification",
      "police notice issued",
      "family emergency funds needed",
      "bank transfer required immediately",
      "package delivery failed—pay now",
      "technical support scam alert",
      "congratulation for winning lottery",
      "click here to send money",
      "urgent lottery win",
      "claim your prize now",
      "lottery winner notification",
      "send money immediately",
      "congratulations you won lottery",
      "welcome to my urgent lottery win",
      "you won the lottery urgently",
      "congratulations on your lottery win",
      "congratulation! you are appointed for the job",
      "job offer urgent verification",
      "click here to accept job offer",
      "deceased client whom I was his legal counsel",
      "administrator of his Estate and other valued assets",
      "better chance to partner with me",
      "reply urgently to enable me",
      "heir-at-law which is legal to designate you",
      "inheritance in accordance with intestate succession rights",
      // New phrases (from recent updates)
      "I’ve been lonely and found you online",
      "send me money for our future together",
      "my love needs your help", // Romance scams
      "your computer is infected call now",
      "grant remote access to fix your device",
      "tech support urgent call", // Tech support scams
      "complete this survey to win cash",
      "earn $500 by filling this form",
      "quick cash for your feedback", // Fake surveys
      "redeem your exclusive voucher today",
      "50% off if you act now",
      "free gift with this coupon", // Fake offers
      "meet your favorite celebrity live",
      "sponsored by a famous star",
      "click to chat with a celeb", // Celebrity scams
      "send deposit to secure the rental",
      "pay now for this apartment",
      "landlord needs payment upfront", // Rental scams
      "adopt this puppy for a small fee",
      "pay shipping for your new pet",
      "rescue this kitten today", // Pet scams
      "IRS demands immediate tax payment",
      "avoid penalties pay now",
      "audit notice requires urgent reply", // Tax/IRS scams
      "enroll for student loan forgiveness",
      "pay fee to erase your debt",
      "financial aid urgent signup", // Student loan scams
      "visa approved pay application fee",
      "secure your green card now",
      "immigration offer expires soon", // Immigration scams
      "update your account now",
      "update your payment details now",
      "recover your account now",
      "call immediately to cancel",
      "talk to a representative now",
    ];

    let highlighted = "";
    let lastIndex = 0;
    const keywords = [...suspiciousKeywords, ...suspiciousPhrases].sort(
      (a, b) => b.length - a.length
    ); // Sort by length to match longer phrases first

    for (let i = 0; i < content.length; i++) {
      let matched = false;
      for (const keyword of keywords) {
        const escapedKeyword = escapeRegExp(keyword.toLowerCase()); // Use escaped version
        if (
          content.substr(i, escapedKeyword.length).toLowerCase() ===
          escapedKeyword
        ) {
          highlighted +=
            content.slice(lastIndex, i) +
            `<span class="highlight">${content.slice(
              i,
              i + escapedKeyword.length
            )}</span>`;
          i += escapedKeyword.length - 1;
          lastIndex = i + 1;
          matched = true;
          break;
        }
      }
      if (!matched && i === content.length - 1) {
        highlighted += content.slice(lastIndex);
      }
    }

    emailContent.innerHTML = highlighted || content; // Use innerHTML for highlighting, fall back to plain text
  }

  // Handle feedback submission (email to feedback@digitalscamalert.com)
  function sendFeedbackEmail() {
    const firstName = document.getElementById("firstName").value.trim();
    const lastName = document.getElementById("lastName").value.trim();
    const feedbackEmail = document.getElementById("feedbackEmail").value.trim();
    const feedback = document.getElementById("feedbackText").value.trim();

    if (!feedback) {
      feedbackStatus.textContent =
        "Please provide feedback text before sending.";
      feedbackStatus.style.color = "#dc3545";
      return;
    }

    let name = "";
    if (firstName || lastName) {
      name = `${firstName} ${lastName}`.trim() || "Anonymous";
    }

    const subject = encodeURIComponent(
      `Feedback for Scam Checker by Prakash Suvedi${
        name ? ` from ${name}` : ""
      }`
    );
    const body = encodeURIComponent(`
      ${name ? `Name: ${name}\n` : ""}
      ${feedbackEmail ? `Email: ${feedbackEmail}\n` : ""}
      Feedback: ${feedback}
      Date: ${new Date().toISOString()}
    `);
    const mailtoLink = `mailto:feedback@digitalscamalert.com?subject=${subject}&body=${body}`;

    // Open email client (user must have an email client configured)
    try {
      window.location.href = mailtoLink;
      feedbackStatus.textContent = "Feedback sent successfully! Thank you.";
      feedbackStatus.style.color = "#28a745";
      document.getElementById("firstName").value = "";
      document.getElementById("lastName").value = "";
      document.getElementById("feedbackEmail").value = "";
      document.getElementById("feedbackText").value = "";
      setTimeout(() => {
        feedbackSection.style.display = "none";
        feedbackStatus.textContent = "";
      }, 3000);
    } catch (error) {
      console.error("Feedback email error:", error);
      feedbackStatus.textContent =
        "Error sending feedback. Please ensure you have an email client configured or contact us at feedback@digitalscamalert.com.";
      feedbackStatus.style.color = "#dc3545";
    }
  }

  // Show feedback section and handle button click
  sendFeedback.addEventListener("click", sendFeedbackEmail);

  // Add feedback button to results
  function displayResults(analysis, detectedLanguage = "eng") {
    const resultDiv = document.getElementById("result");
    const riskBarFillStyle = `width: ${
      analysis.riskScore
    }%; background-color: ${
      analysis.riskClass === "risk-high"
        ? "#dc3545"
        : analysis.riskClass === "risk-medium"
        ? "#ffc107"
        : "#28a745"
    };`;

    resultDiv.innerHTML = `
      <h2>Analysis Results</h2>
      <p><strong>Risk Score:</strong> <span class="${analysis.riskClass}">${
      analysis.riskScore
    } (${analysis.riskLevel})</span></p>
      <div class="risk-bar">
        <div class="progress-bar" id="progressBar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
      </div>
      <p class="language-note">Language detected: ${detectedLanguage.toUpperCase()}, Translated to English and Analyzed</p>
      ${analysis.reasons.join("")}
      <h3>Highlighted Suspicious Content (Translated):</h3>
      <div class="highlighted-content">${analysis.highlightedContent}</div>
      <h3>Tips to Stay Safe <i class="fas fa-shield-alt tip-icon" style="color: #ff0000;"></i></h3>
      <div class="tips">
        <ul>
          <li><i class="fas fa-exclamation-triangle tip-icon"></i> Do not click links or accept offers—verify separately.</li>
          <li><i class="fas fa-lock tip-icon"></i> Check the sender’s email domain (e.g., avoid .xyz, .top, or free services unless verified).</li>
          <li><i class="fas fa-phone tip-icon"></i> Contact the company directly via their official website or phone number.</li>
          <li><i class="fas fa-shield-virus tip-icon"></i> Beware of AI-generated scams like voice cloning or deepfakes—verify identities manually.</li>
          <li><i class="fas fa-globe tip-icon"></i> Protect against Nepal-specific scams (e.g., mobile recharge, Nepal bank fraud) by checking official sources (e.g., <a href="https://nepalpolice.gov.np/cyber-bureau" target="_blank">Nepal Police Cyber Bureau</a>).</li>
          <li><i class="fas fa-users tip-icon"></i> Be cautious of social media scams on Instagram, Facebook, WhatsApp, or Twitter—verify posts independently.</li>
          <li><i class="fas fa-envelope tip-icon"></i> Avoid phishing emails claiming urgent action; use VPNs for security—see our NordVPN review at <a href="https://digitalscamalert.com/vpn-reviews" target="_blank">digitalscamalert.com</a>.</li>
          <li><i class="fas fa-flag tip-icon"></i> Report suspicious activity at <a href="https://digitalscamalert.com/report-scam" target="_blank">digitalscamalert.com</a> or Nepal authorities.</li>
          <li><i class="fas fa-info-circle tip-icon"></i> Stay updated on 2025 cybersecurity trends by following <a href="https://x.com/digitalscamalert" target="_blank">@digitalscamalert</a> on X.</li>
          <li><i class="fas fa-user-shield tip-icon"></i> Use two-factor authentication and secure passwords to protect against identity theft.</li>
        </ul>
      </div>
      <p class="disclaimer">Disclaimer: This tool provides an automated analysis and is not a substitute for professional cybersecurity advice. Verify results independently and report suspicious activity to authorities.</p>
      <button class="feedback-btn" onclick="toggleFeedback()">Provide Feedback</button>
    `;
    resultDiv.style.display = "block";
    resultDiv.classList.add("result");
    // Update references to progress bar elements after rendering
    progressBar = document.getElementById("progressBar"); // Update reference (allowed with `let`)
    progressFill = document.getElementById("progressFill"); // Update reference (allowed with `let`)
    if (progressBar && progressFill) {
      console.log("Updated progress bar elements after results:", {
        progressBar,
        progressFill,
      });
      showProgress(0, analysis.riskScore); // Show final risk score
    } else {
      console.error("Progress bar elements not found after rendering results.");
    }
  }

  // Updated analyzeScam function for improved domain and sentence/phrase analysis
  async function analyzeScam(input, emailInput = null, socialPlatform = null) {
    console.log(
      "Analyzing input:",
      input,
      "Email ID:",
      emailInput,
      "Social Platform:",
      socialPlatform
    );
    const suspiciousKeywords = [
      "urgent",
      "verify",
      "account",
      "password",
      "login",
      "click here",
      "limited time",
      "congratulations",
      "winner",
      "prize",
      "suspicious activity",
      "immediately",
      "voice cloning",
      "deepfake",
      "Nepal bank",
      "mobile recharge",
      "crypto wallet",
      "free money",
      "win lottery",
      "bank transfer",
      "security alert",
      "update now",
      "confirm details",
      "access denied",
      "blocked account",
      "payment pending",
      "urgent action",
      "immediate response",
      "act fast",
      "exclusive offer",
      "special deal",
      "cash prize",
      "gift card",
      "free trial",
      "unclaimed funds",
      "inheritance",
      "investment opportunity",
      "high returns",
      "guaranteed profit",
      "risk-free",
      "bitcoin scam",
      "crypto giveaway",
      "token sale",
      "wallet hack",
      "phishing link",
      "malware download",
      "virus warning",
      "system error",
      "account locked",
      "identity theft",
      "credit card fraud",
      "personal data",
      "sensitive information",
      "verify identity",
      "social security",
      "tax refund",
      "government grant",
      "police notice",
      "court order",
      "legal action",
      "arrest warrant",
      "emergency funds",
      "family emergency",
      "hospital bill",
      "kidnapping scam",
      "grandparent scam",
      "CEO fraud",
      "invoice scam",
      "delivery failed",
      "package tracking",
      "customs clearance",
      "Nepal police",
      "bank of Nepal",
      "mobile top-up",
      "recharge offer",
      "SIM card scam",
      "data breach",
      "hacked account",
      "password reset",
      "two-factor auth",
      "unauthorized access",
      "suspicious login",
      "account suspension",
      "verification code",
      "one-time password",
      "OTP scam",
      "fake invoice",
      "charity fraud",
      "donation request",
      "fundraising scam",
      "AI-generated",
      "deepfake video",
      "voice impersonation",
      "synthetic voice",
      "AI chatbot",
      "fake customer service",
      "technical support",
      "refund processing",
      "overpayment scam",
      "money mule",
      "wire transfer",
      "bank draft",
      "cash app",
      "PayPal scam",
      "eBay fraud",
      "Amazon scam",
      "UPS delivery",
      "FedEx alert",
      "DHL notice",
      "tracking number",
      "package scam",
      "Nepal telecom",
      "Ncell scam",
      "appointed",
      "job",
      "offer",
      // African inheritance scam-specific keywords
      "Africa",
      "African",
      "Central African Republic",
      "Bangui",
      "Estate",
      "deceased",
      "client",
      "legal counsel",
      "administrator",
      "valued assets",
      "heir",
      "partner",
      "inheritance",
      "succession",
      "reply urgently",
      // New keywords (from recent updates)
      "romance",
      "love",
      "soulmate",
      "dating",
      "girlfriend",
      "boyfriend",
      "lonely", // Romance scams
      "tech support",
      "virus detected",
      "remote access",
      "fix now",
      "call this number", // Tech support scams
      "survey",
      "feedback reward",
      "complete this",
      "earn cash",
      "quick money", // Fake surveys
      "voucher",
      "coupon",
      "discount code",
      "redeem now",
      "exclusive gift", // Fake offers
      "celebrity",
      "endorsement",
      "sponsored",
      "meet me",
      "live chat", // Celebrity scams
      "rental",
      "deposit",
      "landlord",
      "property",
      "lease agreement", // Rental scams
      "puppy",
      "pet adoption",
      "kitten",
      "shipping fee",
      "animal rescue", // Pet scams
      "IRS",
      "tax penalty",
      "audit notice",
      "pay taxes",
      "revenue service", // Tax/IRS scams
      "student loan",
      "debt relief",
      "forgiveness",
      "enroll now",
      "financial aid", // Student loan scams
      "visa",
      "immigration",
      "green card",
      "citizenship",
      "application fee", // Immigration scams
      "update account",
      "update payment",
      "auto debit",
      "approval notice",
      "chamber of commerce",
      "accredited investor",
      "security alert",
      "+1 8889298873", // Phone number (handled by escapeRegExp)
    ];

    const suspiciousPhrases = [
      "click here to verify your account",
      "urgent action required now",
      "your account has been compromised",
      "win a free prize today",
      "limited time offer expires",
      "immediate response needed",
      "confirm your identity to avoid suspension",
      "crypto investment opportunity",
      "Nepal bank urgent verification",
      "mobile recharge offer expired",
      "AI-generated voice message",
      "deepfake video proof",
      "suspicious activity detected",
      "act fast to claim your prize",
      "government grant notification",
      "police notice issued",
      "family emergency funds needed",
      "bank transfer required immediately",
      "package delivery failed—pay now",
      "technical support scam alert",
      "congratulation for winning lottery",
      "click here to send money",
      "urgent lottery win",
      "claim your prize now",
      "lottery winner notification",
      "send money immediately",
      "congratulations you won lottery",
      "welcome to my urgent lottery win",
      "you won the lottery urgently",
      "congratulations on your lottery win",
      "congratulation! you are appointed for the job",
      "job offer urgent verification",
      "click here to accept job offer",
      "deceased client whom I was his legal counsel",
      "administrator of his Estate and other valued assets",
      "better chance to partner with me",
      "reply urgently to enable me",
      "heir-at-law which is legal to designate you",
      "inheritance in accordance with intestate succession rights",
      // New phrases (from recent updates)
      "I’ve been lonely and found you online",
      "send me money for our future together",
      "my love needs your help", // Romance scams
      "your computer is infected call now",
      "grant remote access to fix your device",
      "tech support urgent call", // Tech support scams
      "complete this survey to win cash",
      "earn $500 by filling this form",
      "quick cash for your feedback", // Fake surveys
      "redeem your exclusive voucher today",
      "50% off if you act now",
      "free gift with this coupon", // Fake offers
      "meet your favorite celebrity live",
      "sponsored by a famous star",
      "click to chat with a celeb", // Celebrity scams
      "send deposit to secure the rental",
      "pay now for this apartment",
      "landlord needs payment upfront", // Rental scams
      "adopt this puppy for a small fee",
      "pay shipping for your new pet",
      "rescue this kitten today", // Pet scams
      "IRS demands immediate tax payment",
      "avoid penalties pay now",
      "audit notice requires urgent reply", // Tax/IRS scams
      "enroll for student loan forgiveness",
      "pay fee to erase your debt",
      "financial aid urgent signup", // Student loan scams
      "visa approved pay application fee",
      "secure your green card now",
      "immigration offer expires soon", // Immigration scams
      "update your account now",
      "update your payment details now",
      "recover your account now",
      "call immediately to cancel",
      "talk to a representative now",
    ];

    const urlPattern = /^(https?:\/\/[^\s]+)/;
    const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const isUrl = urlPattern.test(input);
    let reasons = [];
    let keywordScore = 0;
    let virusTotalRequests = 0; // Track requests for rate limit

    // Combine input and email for analysis if both are provided
    let analysisInput = input;
    if (emailInput) {
      analysisInput += (analysisInput ? " " : "") + emailInput; // Append email if provided
    }

    // Extract email from input or emailInput for domain analysis
    let email = emailInput || (input.match(emailPattern) || [])[0];
    let domainRisk = 0;
    let domainReason = "";

    if (email) {
      const domain = email.split("@")[1].toLowerCase();
      // Disable VirusTotal API calls for GitHub Pages due to CORS (use heuristic instead)
      console.warn(
        "VirusTotal API disabled in GitHub Pages due to CORS restrictions. Using heuristic checks."
      );
      const knownSafeDomains = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "google.com",
        "microsoft.com",
        "apple.com",
        "amazon.com",
        "ntc.net.np",
        "ncell.com.np",
      ];
      const suspiciousTlds = [
        ".tty",
        ".xyz",
        ".top",
        ".info",
        ".club",
        ".online",
        ".site",
      ];
      const isKnownSafe = knownSafeDomains.some((d) => domain === d);
      const isSuspiciousTld = suspiciousTlds.some((tld) =>
        domain.endsWith(tld)
      );

      if (isKnownSafe) {
        domainRisk = 15; // Low Risk
        domainReason = `Verified email domain detected: ${domain} (low risk, known safe domain)`;
        reasons.push(`<span class="domain-low">${domainReason}</span>`);
      } else if (isSuspiciousTld) {
        domainRisk = 100; // High Risk
        domainReason = `Suspicious email domain detected: ${domain} (unknown TLD, verify independently)`;
        reasons.push(`<span class="domain-high">${domainReason}</span>`);
      } else {
        domainRisk = 50; // Medium Risk
        domainReason = `Unknown email domain detected: ${domain} (not in known list, verify independently)`;
        reasons.push(domainReason);
      }
    }

    // Check for keywords (weighted scoring, prioritize highly suspicious terms)
    suspiciousKeywords.forEach((keyword) => {
      if (analysisInput.toLowerCase().includes(keyword)) {
        const weight = [
          "urgent",
          "immediately",
          "congratulations",
          "winner",
          "prize",
          "lottery",
          "click here",
          "won",
          "appointed",
          "job",
          "Africa",
          "African",
          "Central African Republic",
          "Bangui",
          "deceased",
          "client",
          "Estate",
          "inheritance",
          "heir",
          "partner",
        ].includes(keyword)
          ? 20 // Reduced from 40 for standalone keywords
          : 10; // Reduced from 15 for less critical keywords
        keywordScore += weight;
        reasons.push(`Contains scam keyword: ${keyword} (Weight: ${weight})`);
        console.log(`Matched keyword: ${keyword}, Score: ${weight}`);
      }
    });

    // Check for phrases (higher weight, fuzzy matching for variations, improved regex for punctuation)
    suspiciousPhrases.forEach((phrase) => {
      const phraseLower = phrase.toLowerCase().replace(/[.!?,]/g, ""); // Normalize punctuation
      const escapedPhrase = escapeRegExp(phraseLower); // Escape special characters
      const phraseRegex = new RegExp(
        `\\b${escapedPhrase.replace(/\s+/g, "\\s*")}[.!]?\\b`,
        "i"
      ); // Allow punctuation
      if (phraseRegex.test(analysisInput.toLowerCase())) {
        keywordScore += 60; // Maintain or increase for phrases
        reasons.push(
          `Contains scam phrase: ${phrase} (or similar variation)`
        );
        console.log(`Matched phrase: ${phrase}`);
      }
    });

    // Enhanced sentence-level analysis for African inheritance scams and other patterns
    const doc = window.nlp(analysisInput);
    const sentences = doc.sentences().out("array");
    let sentenceScore = 0;

    sentences.forEach((sentence) => {
      const sentDoc = window.nlp(sentence);
      let sentenceRisk = 0;
      let sentenceReason = [];

      // Check for African inheritance scam patterns
      const isAfrican = /africa|african|central african republic|bangui/i.test(
        sentence.toLowerCase()
      );
      const hasDeceasedClient = /deceased|client/i.test(
        sentence.toLowerCase()
      );
      const hasEstateInheritance = /estate|inheritance|heir/i.test(
        sentence.toLowerCase()
      );
      const hasUrgency = /urgent|immediately|reply urgently/i.test(
        sentence.toLowerCase()
      );

      if (
        isAfrican &&
        hasDeceasedClient &&
        hasEstateInheritance &&
        hasUrgency
      ) {
        sentenceRisk += 120; // Increase weight for full African inheritance scam pattern
        sentenceReason.push(
          `Highly suspicious African inheritance scam pattern detected in sentence: "${sentence}" (Weight: 120)`
        );
      } else if (
        (isAfrican || hasDeceasedClient || hasEstateInheritance) &&
        hasUrgency
      ) {
        sentenceRisk += 80; // Increase weight for partial African inheritance scam pattern with urgency
        sentenceReason.push(
          `Potential African inheritance scam pattern detected in sentence: "${sentence}" (Weight: 80)`
        );
      } else if (isAfrican || hasDeceasedClient || hasEstateInheritance) {
        sentenceRisk += 40; // Increase weight for partial African inheritance scam pattern
        sentenceReason.push(
          `Possible African inheritance scam indicator in sentence: "${sentence}" (Weight: 40)`
        );
      }

      // Check for other scam patterns (urgency + action requests)
      if (
        hasUrgency &&
        (sentDoc.match("#Verb #Click #Here").found ||
          sentDoc.match("#Verb #Send #Money").found ||
          sentDoc.match("#Verb #Accept #Job").found)
      ) {
        sentenceRisk += 50; // Medium weight for urgency with action requests
        sentenceReason.push(
          `Urgent action request detected in sentence: "${sentence}" (Weight: 50)`
        );
      }

      // Check for monetary or personal data requests
      if (
        sentDoc.match("#Money #Offer").found ||
        sentDoc.match("#PersonalData #Request").found
      ) {
        sentenceRisk += 40; // Medium weight for monetary/personal data requests
        sentenceReason.push(
          `Monetary or personal data request detected in sentence: "${sentence}" (Weight: 40)`
        );
      }

      // Add sentence-level risk to total score
      if (sentenceRisk > 0) {
        keywordScore += sentenceRisk;
        reasons.push(...sentenceReason.map((reason) => `<p>${reason}</p>`));
      }
    });

    // Boost score for combinations of urgent/lottery/click here/won/appointed/job
    if (
      (analysisInput.toLowerCase().includes("urgent") ||
        analysisInput.toLowerCase().includes("immediately")) &&
      (analysisInput.toLowerCase().includes("lottery") ||
        analysisInput.toLowerCase().includes("prize") ||
        analysisInput.toLowerCase().includes("won") ||
        analysisInput.toLowerCase().includes("appointed") ||
        analysisInput.toLowerCase().includes("job")) &&
      (analysisInput.toLowerCase().includes("click here") ||
        analysisInput.toLowerCase().includes("send money"))
    ) {
      keywordScore += 30; // Bonus for highly suspicious combinations
      reasons.push(
        "Highly suspicious combination: urgent job/lottery/prize/win with action request"
      );
    }

    // Ensure High Risk for job/appointed with suspicious domains or no domain
    if (
      (analysisInput.toLowerCase().includes("congratulation") ||
        analysisInput.toLowerCase().includes("congratulations") ||
        analysisInput.toLowerCase().includes("appointed")) &&
      (analysisInput.toLowerCase().includes("job") ||
        analysisInput.toLowerCase().includes("offer")) &&
      (domainRisk >= 50 || !email)
    ) {
      keywordScore = Math.max(keywordScore, 100); // Guarantee 100% (High Risk) for suspicious job offers
      reasons.push(
        "Guaranteed High Risk: suspicious job offer with anonymous or no domain"
      );
    }

    // Ensure Low Risk for job/appointed with validated domains
    if (
      (analysisInput.toLowerCase().includes("congratulation") ||
        analysisInput.toLowerCase().includes("congratulations") ||
        analysisInput.toLowerCase().includes("appointed")) &&
      (analysisInput.toLowerCase().includes("job") ||
        analysisInput.toLowerCase().includes("offer")) &&
      domainRisk === 15
    ) {
      keywordScore = Math.min(keywordScore, 15); // Limit to 15% (Low Risk) for validated domains
      reasons.push("Low Risk: verified job offer from trusted domain");
    }

    // Check for social platform text (if provided via image or input)
    if (socialPlatform) {
      keywordScore += 20; // Add risk for social platform presence
      reasons.push(
        `<p class="platform-note">Platform Detected: <span class="platform-icon">${getPlatformIcon(
          socialPlatform
        )}</span> ${socialPlatform}</p>`
      );
    }

    // Check for URLs and analyze with VirusTotal (disabled for GitHub Pages due to CORS, using heuristic)
    if (isUrl) {
      const url = input;
      try {
        console.warn(
          "VirusTotal API disabled in GitHub Pages due to CORS restrictions. Using heuristic checks."
        );
        // Mock safe response for URLs
        const urlAnalysis = {
          malicious: false,
          suspicious: false,
          positives: 0,
        };
        if (urlAnalysis.malicious || urlAnalysis.positives > 0) {
          keywordScore += 50; // High Risk for malicious URLs
          reasons.push(
            `Malicious URL detected: ${url} (simulated, ${urlAnalysis.positives} engines)`
          );
        } else if (urlAnalysis.suspicious) {
          keywordScore += 30; // Medium Risk for suspicious URLs
          reasons.push(
            `Suspicious URL detected: ${url} (simulated as suspicious)`
          );
        }
      } catch (error) {
        console.error("Simulated URL check error:", error);
      }
    }

    // Check VirusTotal rate limit (500 requests/day, unused in this version due to heuristic)
    if (virusTotalRequests >= 490) {
      // Warning threshold
      reasons.push(
        '<p class="rate-limit-warning">Approaching VirusTotal request limit (500/day)—some checks may be delayed.</p>'
      );
    }

    // Add domain risk to total score
    keywordScore += domainRisk;

    // Calculate risk score (0-100), ensure at least Low Risk for any input with text
    const riskScore = Math.min(100, Math.max(15, keywordScore)); // Minimum 15% for any input with text
    let riskLevel = "Low Risk";
    let riskClass = "risk-low";
    if (riskScore >= 50) {
      riskLevel = "High Risk";
      riskClass = "risk-high";
    } else if (riskScore >= 30) {
      riskLevel = "Medium Risk";
      riskClass = "risk-medium";
    }

    // Add website contact for valid domains
    if (domainRisk === 15 && email) {
      const domain = email.split("@")[1];
      reasons.push(
        `<p>For more details, contact this website: <a href="http://${domain}" target="_blank" class="domain-low">${domain}</a></p>`
      );
    }

    console.log(
      "Final keywordScore:",
      keywordScore,
      "Risk Score:",
      riskScore,
      "Email Risk:",
      domainRisk,
      "VirusTotal Requests:",
      virusTotalRequests,
      "Platform:",
      socialPlatform
    );
    return {
      riskScore,
      riskLevel,
      riskClass,
      reasons,
      highlightedContent: highlightKeywords(analysisInput, [
        ...suspiciousKeywords,
        ...suspiciousPhrases,
      ]),
    };
  }

  // Function to check domain with VirusTotal (disabled for GitHub Pages, using heuristic)
  async function checkDomainWithVirusTotal(domain) {
    console.warn(
      "VirusTotal API disabled in GitHub Pages due to CORS restrictions. Using heuristic checks."
    );
    // Simple heuristic: Check for known safe or suspicious domains
    const knownSafeDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "google.com",
      "microsoft.com",
      "apple.com",
      "amazon.com",
      "ntc.net.np",
      "ncell.com.np",
    ];
    const suspiciousTlds = [
      ".tty",
      ".xyz",
      ".top",
      ".info",
      ".club",
      ".online",
      ".site",
    ];
    const isKnownSafe = knownSafeDomains.some((d) => domain === d);
    const isSuspiciousTld = suspiciousTlds.some((tld) => domain.endsWith(tld));

    if (isKnownSafe) {
      return { malicious: false, suspicious: false, positives: 0 }; // Low Risk
    } else if (isSuspiciousTld) {
      return { malicious: true, suspicious: true, positives: 1 }; // High Risk
    } else {
      return { malicious: false, suspicious: true, positives: 0 }; // Medium Risk
    }
  }

  // Function to check URL with VirusTotal (disabled for GitHub Pages, using heuristic)
  async function checkUrlWithVirusTotal(url) {
    console.warn(
      "VirusTotal API disabled in GitHub Pages due to CORS restrictions. Using heuristic checks."
    );
    return { malicious: false, suspicious: false, positives: 0 }; // Safe default
  }

  function detectSocialPlatform(text) {
    const platforms = {
      gmail: /gmail|compose|inbox|search mail/i, // Gmail-specific keywords
      email: /email|mail|sender|recipient|subject/i, // Generic email indicators
      instagram: /instagram|insta|ig/i,
      facebook: /facebook|fb/i,
      whatsapp: /whatsapp|wa/i,
      twitter: /twitter|x/i,
    };
    // Prioritize email/Gmail over social platforms
    for (const [platform, regex] of Object.entries(platforms)) {
      if (platform === "gmail" && regex.test(text)) return "gmail";
      if (
        platform === "email" &&
        regex.test(text) &&
        !/instagram|facebook|whatsapp|twitter/i.test(text)
      )
        return "email";
      if (
        ["instagram", "facebook", "whatsapp", "twitter"].includes(platform) &&
        regex.test(text)
      )
        return platform;
    }
    return null;
  }

  function getPlatformIcon(platform) {
    const icons = {
      gmail: '<i class="fas fa-envelope" style="color: #D14836;"></i>', // Gmail red envelope
      email: '<i class="fas fa-envelope" style="color: #0078D4;"></i>', // Generic email blue envelope
      instagram: '<i class="fab fa-instagram" style="color: #E4405F;"></i>',
      facebook: '<i class="fab fa-facebook" style="color: #1877F2;"></i>',
      whatsapp: '<i class="fab fa-whatsapp" style="color: #25D366;"></i>',
      twitter: '<i class="fab fa-twitter" style="color: #1DA1F2;"></i>',
    };
    return icons[platform] || "";
  }

  function analyzeLanguage(text) {
    console.log("Analyzing language for:", text);
    const doc = window.nlp(text);
    const scamIndicators = [];

    // Check for urgency (verbs/adjectives)
    if (
      doc.match("#Adjective #Urgent").found ||
      doc.match("#Verb #Immediate").found
    ) {
      scamIndicators.push("Urgent language detected");
    }

    // Check for fear (nouns/adjectives related to loss or threat)
    if (
      doc.match("#Adjective #Suspicious #Noun").found ||
      doc.match("#Noun #Compromised").found
    ) {
      scamIndicators.push(
        "Fear-inducing language (e.g., compromised, suspicious)"
      );
    }

    // Check for excitement (positive offers, prizes, lottery, job, appointed)
    if (
      doc.match("#Adjective #Exciting #Noun").found ||
      doc.match("#Verb #Win").found ||
      doc.match("#Noun #Lottery").found ||
      doc.match("#Noun #Prize").found ||
      doc.match("#Verb #Won").found ||
      doc.match("#Adjective #Congratulations").found ||
      doc.match("#Verb #Appointed").found ||
      doc.match("#Noun #Job").found
    ) {
      scamIndicators.push(
        "Exciting language (e.g., win, prize, lottery, job, appointed, congratulations)"
      );
    }

    // Check for monetary or personal data references
    if (
      doc.match("#Money #Offer").found ||
      doc.match("#PersonalData #Request").found ||
      doc.match("#Verb #Send #Money").found
    ) {
      scamIndicators.push("Monetary or personal data request");
    }

    // Check for action requests (e.g., click here, send money, accept job)
    if (
      doc.match("#Verb #Click #Here").found ||
      doc.match("#Verb #Send #Money").found ||
      doc.match("#Verb #Accept #Job").found
    ) {
      scamIndicators.push(
        "Action request detected (e.g., click here, send money, accept job)"
      );
    }

    // Check for African inheritance scam patterns (context-aware)
    const sentences = doc.sentences().out("array");
    for (const sentence of sentences) {
      const sentDoc = window.nlp(sentence);
      if (
        sentDoc.match("#Noun #Africa").found &&
        (sentDoc.match("#Noun #Deceased").found ||
          sentDoc.match("#Noun #Client").found) &&
        (sentDoc.match("#Noun #Estate").found ||
          sentDoc.match("#Noun #Inheritance").found) &&
        (sentDoc.match("#Verb #Urgent").found ||
          sentDoc.match("#Verb #Reply").found)
      ) {
        scamIndicators.push(
          `Sentence-level African inheritance scam pattern detected: ${sentence}`
        );
        console.log(
          "African inheritance scam sentence pattern detected:",
          sentence
        );
      }
    }

    console.log("Emotion and context indicators found:", scamIndicators);
    return scamIndicators;
  }

  function highlightKeywords(
    content,
    keywords = [],
    highlightClass = "highlight"
  ) {
    let highlighted = content;
    keywords.forEach((keyword) => {
      const escapedKeyword = escapeRegExp(keyword); // Escape special characters
      const regex = new RegExp(`(${escapedKeyword})`, "gi");
      highlighted = highlighted.replace(
        regex,
        '<span class="' + highlightClass + '">$1</span>'
      );
    });
    return highlighted;
  }

  // Functions for reported scam analysis (new functionality)
  async function uploadReportedScams(file) {
    const formData = new FormData();
    formData.append("scamFile", file);

    try {
      const response = await fetch(`${SERVER_URL}/upload-scams`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      showResult(
        data.message || "Reported scams uploaded successfully.",
        "neutral"
      );
      console.log("Uploaded scams:", data.scams);
    } catch (error) {
      console.error("Error uploading reported scams:", error);
      showResult(
        "Error uploading reported scams. Please try again.",
        "neutral"
      );
    }
  }

  async function checkAgainstReported(input) {
    try {
      const response = await fetch(`${SERVER_URL}/check-reported`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await response.json();
      if (data.isReported) {
        showResult(
          `<p style="color: red;">This message has already been reported and identified as a scam: "${data.matchingSentence}"</p>`,
          "risk-high"
        );
        highlightReportedSentence(input, data.matchingSentence);
      } else {
        showResult("No match found in reported scams.", "neutral");
      }
    } catch (error) {
      console.error("Error checking reported scams:", error);
      showResult(
        "Error checking against reported scams. Please try again.",
        "neutral"
      );
    }
  }

  function highlightReportedSentence(content, sentence) {
    const escapedSentence = escapeRegExp(sentence); // Escape special characters
    const regex = new RegExp(`(${escapedSentence})`, "gi");
    const highlighted = content.replace(
      regex,
      '<span class="red-highlight">$1</span>'
    );
    document.getElementById("emailContent").innerHTML = highlighted; // Update textarea
  }

  // Event listeners for reported scam functionality
  // Handle reported scams upload
  document
    .getElementById("reportedScamsUpload")
    .addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        uploadReportedScams(file);
      }
    });

  // Handle reported scams check
  document.getElementById("checkReportedBtn").addEventListener("click", () => {
    const input = document.getElementById("emailContent").value.trim();
    if (input) {
      checkAgainstReported(input);
    } else {
      showResult(
        "Please enter text to check against reported scams.",
        "neutral"
      );
    }
  });
});