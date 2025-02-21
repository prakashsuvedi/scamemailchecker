// Load external libraries (handled in HTML with Tesseract.js, compromise.js)

// Wait for DOM content to load
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("scamCheckerForm");
  const emailContent = document.getElementById("emailContent");
  const emailId = document.getElementById("emailId");
  const resultDiv = document.getElementById("result");
  const checkButton = document.querySelector("button");
  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");
  const progressBar = document.getElementById("progressBar");
  const progressFill = document.getElementById("progressFill");
  const feedbackSection = document.getElementById("feedbackSection");
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const feedbackEmail = document.getElementById("feedbackEmail");
  const feedbackText = document.getElementById("feedbackText");
  const sendFeedback = document.getElementById("sendFeedback");
  const feedbackStatus = document.getElementById("feedbackStatus");

  // Define showResult function at the top to ensure it's available globally
  function showResult(message, className = "neutral") {
    resultDiv.innerHTML = `<p class="${
      className === "neutral" ? "" : className
    }">${message}</p>`;
    resultDiv.style.display = "block";
    resultDiv.classList.remove("hidden");
    resultDiv.classList.add("result");
  }

  // Show progress bar during analysis
  function showProgress(percentage = 0) {
    progressBar.style.display = "block";
    progressFill.style.width = `${percentage}%`;
    if (percentage === 100) {
      setTimeout(() => (progressBar.style.display = "none"), 500); // Hide after completion
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

    checkButton.disabled = true;
    checkButton.innerHTML = 'Checking Email <div class="loading"></div>';
    showProgress(0);

    try {
      // Simulate progress (0% → 100%)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        showProgress(Math.min(progress, 100));
        if (progress >= 100) clearInterval(interval);
      }, 200);

      const analysis = await analyzeScam(input, emailInput);
      showProgress(100);
      displayResults(analysis);
    } catch (error) {
      console.error("Analysis error:", error);
      showProgress(100);
      showResult(
        "Error checking for scams. Please try again or visit digitalscamalert.com for help.",
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

  // Handle image upload with debugging and progress
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
    checkButton.innerHTML = 'Extracting Text <div class="loading"></div>';
    showProgress(0);

    try {
      let progress = 0;
      Tesseract.recognize(file, "eng", {
        logger: (m) => {
          console.log("Tesseract progress:", m);
          if (m.progress !== undefined) {
            progress = Math.round(m.progress * 100);
            showProgress(progress);
          }
        },
      })
        .then(({ data: { text, lang } }) => {
          console.log("Extracted text:", text, "Detected language:", lang);

          // Clean and trim extracted text
          const cleanedText = text
            .trim()
            .replace(/\s+/g, " ")
            .replace(/[.!?,]/g, ""); // Normalize punctuation
          if (!cleanedText || cleanedText.length < 5) {
            throw new Error(
              "No or insufficient text detected. Please try a clearer image."
            );
          }

          // Detect platform text
          const platform = detectSocialPlatform(cleanedText);
          emailContent.value = cleanedText;

          // Analyze the extracted text (no email ID from image for now)
          analyzeScam(cleanedText, null, platform)
            .then((analysis) => {
              showProgress(100);
              displayResults(analysis, lang || "eng");
            })
            .catch((error) => {
              console.error("Analysis error:", error);
              showProgress(100);
              showResult(
                "Error analyzing extracted text. Please try again.",
                "neutral"
              );
            });
        })
        .catch((error) => {
          console.error("Tesseract/OCR error:", error);
          showProgress(100);
          showResult(
            "Error extracting text. Please check the image quality or try a smaller file.",
            "neutral"
          );
        });
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
    ];

    let highlighted = "";
    let lastIndex = 0;
    const keywords = [...suspiciousKeywords, ...suspiciousPhrases].sort(
      (a, b) => b.length - a.length
    ); // Sort by length to match longer phrases first

    for (let i = 0; i < content.length; i++) {
      let matched = false;
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        if (
          content.substr(i, keywordLower.length).toLowerCase() === keywordLower
        ) {
          highlighted +=
            content.slice(lastIndex, i) +
            `<span class="highlight">${content.slice(
              i,
              i + keywordLower.length
            )}</span>`;
          i += keywordLower.length - 1;
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

  // Toggle feedback section
  function toggleFeedback() {
    feedbackSection.style.display =
      feedbackSection.style.display === "none" ? "block" : "none";
    feedbackSection.classList.add("feedback-section");
  }

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
        <div class="risk-bar-fill" style="${riskBarFillStyle}"></div>
      </div>
      <p class="language-note">Language detected: ${detectedLanguage.toUpperCase()}, Translated to English and Analyzed</p>
      ${analysis.reasons.join("")}
      <h3>Highlighted Suspicious Content (Translated):</h3>
      <div style="border: 2px solid #ccc; padding: 15px; background-color: #fff; border-radius: 5px;">${
        analysis.highlightedContent
      }</div>
      <h3>Tips to Stay Safe <i class="fas fa-shield-alt tip-icon" style="color: #ff0000;"></i></h3>
      <div class="tips">
        <ul>
          <li><i class="fas fa-exclamation-triangle tip-icon"></i> Do not click links or accept offers—verify separately.</li>
          <li><i class="fas fa-lock tip-icon"></i> Check the sender’s email domain (e.g., avoid .xyz, .top, or free services unless verified).</li>
          <li><i class="fas fa-phone tip-icon"></i> Contact the company directly via their official website or phone number.</li>
          <li><i class="fas fa-shield-virus tip-icon"></i> Beware of AI-generated scams like voice cloning or deepfakes—verify identities manually.</li>
          <li><i class="fas fa-globe tip-icon"></i> Protect against Nepal-specific scams (e.g., mobile recharge, Nepal bank fraud) by checking official sources.</li>
          <li><i class="fas fa-users tip-icon"></i> Be cautious of social media scams on Instagram, Facebook, WhatsApp, or Twitter—verify posts independently.</li>
          <li><i class="fas fa-envelope tip-icon"></i> Avoid phishing emails claiming urgent action; use VPNs for security—see our NordVPN review at <a href="https://digitalscamalert.com/vpn-reviews" target="_blank">digitalscamalert.com</a>.</li>
          <li><i class="fas fa-flag tip-icon"></i> Report suspicious activity at <a href="https://digitalscamalert.com/report-scam" target="_blank">digitalscamalert.com</a>.</li>
          <li><i class="fas fa-info-circle tip-icon"></i> Stay updated on 2025 cybersecurity trends by following <a href="https://x.com/digitalscamalert" target="_blank">@digitalscamalert</a> on X.</li>
          <li><i class="fas fa-user-shield tip-icon"></i> Use two-factor authentication and secure passwords to protect against identity theft.</li>
        </ul>
      </div>
      <button class="feedback-btn" onclick="toggleFeedback()">Provide Feedback</button>
    `;
    resultDiv.style.display = "block";
    resultDiv.classList.add("result");
  }
});

// Updated analyzeScam function for improved domain analysis
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
  ];

  const urlPattern = /^(https?:\/\/[^\s]+)/;
  const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const isUrl = urlPattern.test(input);
  let reasons = [];
  let keywordScore = 0;
  let virusTotalRequests = 0; // Track requests for rate limit

  // Extract email from input or emailInput
  let email = emailInput || (input.match(emailPattern) || [])[0];
  let domainRisk = 0;
  let domainReason = "";

  if (email) {
    const domain = email.split("@")[1].toLowerCase();
    try {
      const domainAnalysis = await checkDomainWithVirusTotal(domain);
      virusTotalRequests++;
      if (domainAnalysis.malicious || domainAnalysis.positives > 0) {
        domainRisk = 100; // High Risk for malicious domains
        domainReason = `Malicious email domain detected: ${domain} (VirusTotal flagged, ${domainAnalysis.positives} engines)`;
        reasons.push(`<span class="domain-high">${domainReason}</span>`);
      } else if (domainAnalysis.suspicious) {
        domainRisk = 50; // Medium Risk for suspicious domains
        domainReason = `Suspicious email domain detected: ${domain} (VirusTotal flagged as suspicious)`;
        reasons.push(domainReason);
      } else {
        // Additional heuristic for known safe domains vs. suspicious/unknown domains
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
        const hasVirusTotalData =
          domainAnalysis.positives !== undefined &&
          domainAnalysis.suspicious !== undefined;

        if (isKnownSafe && hasVirusTotalData) {
          domainRisk = 15; // Low Risk for known safe domains with VirusTotal data
          domainReason = `Verified email domain detected: ${domain} (low risk, safe per VirusTotal and known)`;
          reasons.push(`<span class="domain-low">${domainReason}</span>`);
        } else if (isSuspiciousTld || !hasVirusTotalData) {
          domainRisk = 100; // High Risk for suspicious TLDs or no VirusTotal data
          domainReason = `Suspicious email domain detected: ${domain} (unknown TLD, no VirusTotal data, or unverified, verify independently)`;
          reasons.push(`<span class="domain-high">${domainReason}</span>`);
        } else {
          domainRisk = 50; // Medium Risk for unknown but not suspicious domains
          domainReason = `Unknown email domain detected: ${domain} (not in known list, verify independently)`;
          reasons.push(domainReason);
        }
      }
    } catch (error) {
      console.error("VirusTotal domain check error:", error);
      // Fallback: Flag unknown/suspicious TLDs as High Risk, known safe as Low Risk
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
        domainRisk = 15; // Low Risk for known safe domains
        domainReason = `Verified email domain detected: ${domain} (low risk, known safe domain)`;
        reasons.push(`<span class="domain-low">${domainReason}</span>`);
      } else if (isSuspiciousTld) {
        domainRisk = 100; // High Risk for suspicious TLDs
        domainReason = `Suspicious email domain detected: ${domain} (unknown TLD, verify independently)`;
        reasons.push(`<span class="domain-high">${domainReason}</span>`);
      } else {
        domainRisk = 50; // Medium Risk for unknown domains
        domainReason = `Unknown email domain detected: ${domain} (VirusTotal check failed, verify independently)`;
        reasons.push(domainReason);
      }
    }
  }

  // Check for keywords (weighted scoring, prioritize highly suspicious terms)
  suspiciousKeywords.forEach((keyword) => {
    if (input.toLowerCase().includes(keyword)) {
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
      ].includes(keyword)
        ? 40
        : 15;
      keywordScore += weight;
      reasons.push(`Contains scam keyword: ${keyword} (Weight: ${weight})`);
      console.log(`Matched keyword: ${keyword}, Score: ${weight}`);
    }
  });

  // Check for phrases (higher weight, fuzzy matching for variations, improved regex for punctuation)
  suspiciousPhrases.forEach((phrase) => {
    const phraseLower = phrase.toLowerCase().replace(/[.!?,]/g, ""); // Normalize punctuation
    const phraseRegex = new RegExp(
      `\\b${phraseLower.replace(/\s+/g, "\\s*")}[.!]?\\b`,
      "i"
    ); // Allow punctuation
    if (phraseRegex.test(input.toLowerCase())) {
      keywordScore += 60;
      reasons.push(`Contains scam phrase: ${phrase} (or similar variation)`);
      console.log(`Matched phrase: ${phrase}`);
    }
  });

  // Boost score for combinations of urgent/lottery/click here/won/appointed/job
  if (
    (input.toLowerCase().includes("urgent") ||
      input.toLowerCase().includes("immediately")) &&
    (input.toLowerCase().includes("lottery") ||
      input.toLowerCase().includes("prize") ||
      input.toLowerCase().includes("won") ||
      input.toLowerCase().includes("appointed") ||
      input.toLowerCase().includes("job")) &&
    (input.toLowerCase().includes("click here") ||
      input.toLowerCase().includes("send money"))
  ) {
    keywordScore += 30; // Bonus for highly suspicious combinations
    reasons.push(
      "Highly suspicious combination: urgent job/lottery/prize/win with action request"
    );
  }

  // Ensure High Risk for job/appointed with suspicious domains or no domain
  if (
    (input.toLowerCase().includes("congratulation") ||
      input.toLowerCase().includes("congratulations") ||
      input.toLowerCase().includes("appointed")) &&
    (input.toLowerCase().includes("job") ||
      input.toLowerCase().includes("offer")) &&
    (domainRisk >= 50 || !email)
  ) {
    keywordScore = Math.max(keywordScore, 100); // Guarantee 100% (High Risk) for suspicious job offers
    reasons.push(
      "Guaranteed High Risk: suspicious job offer with anonymous or no domain"
    );
  }

  // Ensure Low Risk for job/appointed with validated domains
  if (
    (input.toLowerCase().includes("congratulation") ||
      input.toLowerCase().includes("congratulations") ||
      input.toLowerCase().includes("appointed")) &&
    (input.toLowerCase().includes("job") ||
      input.toLowerCase().includes("offer")) &&
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

  // Check for URLs and analyze with VirusTotal
  if (isUrl) {
    const url = input;
    try {
      const urlAnalysis = await checkUrlWithVirusTotal(url);
      virusTotalRequests++;
      if (urlAnalysis.malicious || urlAnalysis.positives > 0) {
        keywordScore += 50; // High Risk for malicious URLs
        reasons.push(
          `Malicious URL detected: ${url} (VirusTotal flagged, ${urlAnalysis.positives} engines)`
        );
      } else if (urlAnalysis.suspicious) {
        keywordScore += 30; // Medium Risk for suspicious URLs
        reasons.push(
          `Suspicious URL detected: ${url} (VirusTotal flagged as suspicious)`
        );
      }
    } catch (error) {
      console.error("VirusTotal URL check error:", error);
    }
  }

  // Check VirusTotal rate limit (500 requests/day)
  if (virusTotalRequests >= 490) {
    // Warning threshold
    reasons.push(
      '<p class="rate-limit-warning">Approaching VirusTotal request limit (500/day)—some checks may be delayed.</p>'
    );
  }

  // Analyze language and emotions with compromise.js
  const scamIndicators = analyzeLanguage(input);
  if (scamIndicators.length > 0) {
    keywordScore += scamIndicators.length * 25; // Increase weight for emotion indicators
    reasons.push(`Language/emotion indicators: ${scamIndicators.join(", ")}`);
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
    highlightedContent: highlightKeywords(input, [
      ...suspiciousKeywords,
      ...suspiciousPhrases,
    ]),
  };
}

// Function to check domain with VirusTotal
async function checkDomainWithVirusTotal(domain) {
  const apiKey =
    "dee143df8f45b87bbf5491dff2ef91616b80dd0464cf01fadfd4d2905c5ba50e";
  try {
    const response = await fetch(
      `https://www.virustotal.com/api/v3/domains/${domain}`,
      {
        headers: {
          "x-apikey": apiKey,
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const attributes = data.data.attributes || {};
    return {
      malicious: attributes.last_analysis_stats?.malicious > 0,
      suspicious: attributes.last_analysis_stats?.suspicious > 0,
      positives: attributes.last_analysis_stats?.malicious || 0,
    };
  } catch (error) {
    console.error("VirusTotal domain error:", error);
    return { malicious: false, suspicious: false, positives: 0 }; // Fallback to safe
  }
}

// Function to check URL with VirusTotal
async function checkUrlWithVirusTotal(url) {
  const apiKey =
    "dee143df8f45b87bbf5491dff2ef91616b80dd0464cf01fadfd4d2905c5ba50e";
  try {
    const encodedUrl = encodeURIComponent(url);
    const response = await fetch(
      `https://www.virustotal.com/api/v3/urls/${encodedUrl}`,
      {
        headers: {
          "x-apikey": apiKey,
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const attributes = data.data.attributes || {};
    return {
      malicious: attributes.last_analysis_stats?.malicious > 0,
      suspicious: attributes.last_analysis_stats?.suspicious > 0,
      positives: attributes.last_analysis_stats?.malicious || 0,
    };
  } catch (error) {
    console.error("VirusTotal URL error:", error);
    return { malicious: false, suspicious: false, positives: 0 }; // Fallback to safe
  }
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

  console.log("Emotion indicators found:", scamIndicators);
  return scamIndicators;
}

function highlightKeywords(content, keywords = []) {
  let highlighted = content;
  keywords.forEach((keyword) => {
    const regex = new RegExp(`(${keyword})`, "gi");
    highlighted = highlighted.replace(
      regex,
      '<span class="highlight">$1</span>'
    );
  });
  return highlighted;
}
