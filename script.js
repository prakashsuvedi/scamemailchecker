function checkEmail() {
  const emailContent = document.getElementById("emailContent").value;
  const resultDiv = document.getElementById("result");
  const checkButton = document.querySelector("button");

  // Disable the button and show loading animation
  checkButton.disabled = true;
  checkButton.innerHTML = 'Checking Email <div class="loading"></div>';

  // Reset results
  resultDiv.innerHTML = "";

  // Simulate a delay for analysis (replace this with your actual analysis logic)
  setTimeout(() => {
    // Step 1: Highlight suspicious keywords
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
    ];
    let highlightedContent = emailContent;
    suspiciousKeywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlightedContent = highlightedContent.replace(
        regex,
        '<span class="highlight">$1</span>'
      );
    });

    // Step 2: Check for mismatched sender domains
    const senderDomain = emailContent.match(/From:.*@(.*)>/i);
    let domainCheckResult = "";
    if (senderDomain && senderDomain[1]) {
      const domain = senderDomain[1];
      const isSuspicious =
        domain.includes("fake") ||
        domain.includes("scam") ||
        domain.includes("xyz");
      domainCheckResult = isSuspicious
        ? `<p><strong>Sender Domain:</strong> <span class="highlight">${domain}</span> (suspicious)</p>`
        : `<p><strong>Sender Domain:</strong> ${domain} (looks safe)</p>`;
    }

    // Step 3: Calculate risk score
    const keywordCount = suspiciousKeywords.filter((keyword) =>
      emailContent.toLowerCase().includes(keyword)
    ).length;
    const riskScore = Math.min(100, keywordCount * 20); // Simple scoring logic
    let riskLevel = "";
    let riskClass = "";
    if (riskScore >= 60) {
      riskLevel = "High Risk";
      riskClass = "risk-high";
    } else if (riskScore >= 30) {
      riskLevel = "Medium Risk";
      riskClass = "risk-medium";
    } else {
      riskLevel = "Low Risk";
      riskClass = "risk-low";
    }

    // Step 4: Analyze language using Compromise.js
    const scamIndicators = analyzeLanguage(emailContent);
    let scamIndicatorResult = "";
    if (scamIndicators.length > 0) {
      scamIndicatorResult = `<p><strong>Scam Indicators:</strong> ${scamIndicators.join(
        ", "
      )}</p>`;
    }

    // Step 5: Add Risk Level Bar
    const riskBarFill = `<div class="risk-bar">
      <div class="risk-bar-fill" style="width: ${riskScore}%; background-color: ${
      riskClass === "risk-high"
        ? "red"
        : riskClass === "risk-medium"
        ? "orange"
        : "green"
    };"></div>
    </div>`;

    // Step 6: Display results
    resultDiv.innerHTML = `
      <h2>Analysis Results</h2>
      <p><strong>Risk Score:</strong> <span class="${riskClass}">${riskScore} (${riskLevel})</span></p>
      ${riskBarFill}
      ${domainCheckResult}
      ${scamIndicatorResult}
      <h3>Highlighted Suspicious Content:</h3>
      <div style="border: 1px solid #ccc; padding: 10px;">${highlightedContent}</div>
      <h3>Tips:</h3>
      <ul>
        <li>Do not click on any links in the email.</li>
        <li>Verify the sender's email address.</li>
        <li>If unsure, contact the company directly through their official website.</li>
      </ul>
    `;

    // Re-enable the button and remove loading animation
    checkButton.disabled = false;
    checkButton.innerHTML = "Check Email";
  }, 2000); // Simulate a 2-second delay for analysis
}

function analyzeLanguage(text) {
  const doc = window.nlp(text);
  const scamIndicators = doc.match("#ScamIndicator").out("array"); // Customize this based on your needs
  return scamIndicators;
}
