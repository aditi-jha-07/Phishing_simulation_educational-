const pool = require('./db');

async function initializeDatabase() {
  const conn = await pool.getConnection();
  try {
    console.log('🗄️  Initializing database...');

    // Create users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student','admin') NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create scenarios table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS scenarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email_subject TEXT NOT NULL,
        email_from VARCHAR(255) NOT NULL,
        email_body LONGTEXT NOT NULL,
        correct_answer ENUM('phish','legitimate') NOT NULL,
        explanation TEXT,
        difficulty ENUM('easy','medium','hard') DEFAULT 'medium',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create simulations table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS simulations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        score INT DEFAULT 0,
        total_questions INT DEFAULT 10,
        completed TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Create simulation_answers table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS simulation_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        simulation_id INT NOT NULL,
        scenario_id INT NOT NULL,
        student_answer ENUM('phish','legitimate') NOT NULL,
        correct_answer ENUM('phish','legitimate') NOT NULL,
        is_correct TINYINT(1) NOT NULL,
        answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (simulation_id) REFERENCES simulations(id) ON DELETE CASCADE,
        FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // Seed sample scenarios if empty
    const [existingScenarios] = await conn.execute('SELECT COUNT(*) as count FROM scenarios');
    if (existingScenarios[0].count === 0) {
      console.log('🌱 Seeding sample scenarios...');
      await seedScenarios(conn);
    }

    console.log('✅ Database initialized successfully');
  } finally {
    conn.release();
  }
}

async function seedScenarios(conn) {
  const scenarios = [
    {
      subject: 'URGENT: Your account has been suspended - Verify now',
      from: 'security@paypa1-support.com',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/39/PayPal_logo.svg" alt="PayPal" style="height:30px;margin-bottom:20px;">
        <p>Dear Customer,</p>
        <p>We have detected <strong>unusual activity</strong> in your account. Your account has been <strong style="color:red">temporarily suspended</strong> for security reasons.</p>
        <p>You must verify your identity within <strong>24 hours</strong> or your account will be permanently closed.</p>
        <p><a href="http://paypa1-verify.com/confirm" style="background:#003087;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">Verify My Account Now</a></p>
        <p>PayPal Security Team</p>
      </div>`,
      answer: 'phish',
      explanation: 'The sender domain is "paypa1-support.com" (using number 1 instead of letter l). Legitimate PayPal emails come from @paypal.com. The urgency tactic and threat of account closure are classic phishing signs.',
      difficulty: 'easy'
    },
    {
      subject: 'Your Amazon Order #112-9384756-2847563 has shipped',
      from: 'shipment-tracking@amazon.com',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; background:#f3f3f3; padding:20px;">
        <div style="background:white;padding:20px;border-radius:8px;">
          <h2 style="color:#232f3e;">Your order is on the way!</h2>
          <p>Hi Customer,</p>
          <p>Good news! Your order <strong>#112-9384756-2847563</strong> has shipped.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Item:</strong></td><td style="padding:8px;border:1px solid #ddd;">Wireless Keyboard - Model MK270</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Estimated Delivery:</strong></td><td style="padding:8px;border:1px solid #ddd;">Thursday, December 14</td></tr>
            <tr><td style="padding:8px;border:1px solid #ddd;"><strong>Carrier:</strong></td><td style="padding:8px;border:1px solid #ddd;">UPS</td></tr>
          </table>
          <a href="https://www.amazon.com/gp/css/summary/edit.html" style="background:#FF9900;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Track Your Package</a>
          <p style="color:#666;font-size:12px;margin-top:20px;">Amazon.com, LLC | 410 Terry Ave N, Seattle, WA 98109</p>
        </div>
      </div>`,
      answer: 'legitimate',
      explanation: 'This is a legitimate Amazon shipping notification. The sender domain is @amazon.com, the order number format is correct, it contains specific shipping details, and the link points to amazon.com. No urgency tactics or credential requests.',
      difficulty: 'medium'
    },
    {
      subject: 'IT Department: Password expiration notice - Action required',
      from: 'it-helpdesk@university-itsupport.net',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background:#1a3a6b;color:white;padding:16px;">
          <h2>University IT Help Desk</h2>
        </div>
        <div style="padding:20px;">
          <p>Dear University Member,</p>
          <p>Your university password will expire in <strong>2 hours</strong>. To avoid losing access to all university systems (email, library, course portal), you must update your password immediately.</p>
          <p><strong>Click below and enter your current credentials to extend your password:</strong></p>
          <p><a href="http://university-itsupport.net/password-reset" style="background:#1a3a6b;color:white;padding:12px 24px;text-decoration:none;border-radius:4px;">Update Password Now</a></p>
          <p>Failure to act will result in immediate account lockout.</p>
          <p>IT Help Desk Team</p>
        </div>
      </div>`,
      answer: 'phish',
      explanation: 'Red flags: The domain "university-itsupport.net" is not the official university domain. Real IT departments don\'t ask for your current password. The 2-hour urgency window is a pressure tactic. Legitimate password resets direct you to your university\'s official portal.',
      difficulty: 'medium'
    },
    {
      subject: 'Google Security Alert: New sign-in from Windows device',
      from: 'no-reply@accounts.google.com',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; padding:20px;">
        <div style="border-bottom:3px solid #4285F4;padding-bottom:16px;margin-bottom:16px;">
          <span style="color:#4285F4;font-size:24px;font-weight:bold;">G</span><span style="color:#EA4335;">o</span><span style="color:#FBBC04;">o</span><span style="color:#4285F4;">g</span><span style="color:#34A853;">l</span><span style="color:#EA4335;">e</span>
        </div>
        <h3>New sign-in to your Google Account</h3>
        <p>Your Google Account was just signed in to from a new Windows device. If this was you, you don't need to do anything. If not, we'll help you secure your account.</p>
        <table style="background:#f8f8f8;padding:16px;border-radius:8px;width:100%;">
          <tr><td><strong>Device:</strong></td><td>Windows PC</td></tr>
          <tr><td><strong>Location:</strong></td><td>Chicago, IL, USA</td></tr>
          <tr><td><strong>Time:</strong></td><td>Today, 2:14 PM</td></tr>
        </table>
        <p><a href="https://myaccount.google.com/notifications" style="color:#4285F4;">Check activity</a> | <a href="https://accounts.google.com/signin/v2/identifier" style="color:#4285F4;">Secure account</a></p>
        <p style="color:#777;font-size:12px;">Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043</p>
      </div>`,
      answer: 'legitimate',
      explanation: 'This is a legitimate Google security alert. The sender is @accounts.google.com (official Google domain), the email doesn\'t ask for your password, it provides real device/location info, and the links point to myaccount.google.com and accounts.google.com — both official Google domains.',
      difficulty: 'hard'
    },
    {
      subject: 'You\'ve won $1,000 in our monthly sweepstakes! Claim now',
      from: 'prizes@winner-notification-center.com',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; text-align:center; background:#fff9e6; padding:30px;">
        <div style="font-size:60px;">🏆</div>
        <h1 style="color:#ff6b00;">CONGRATULATIONS!</h1>
        <p style="font-size:18px;">You have been selected as our <strong>Monthly Lucky Winner!</strong></p>
        <div style="background:#ff6b00;color:white;padding:20px;border-radius:12px;margin:20px 0;">
          <h2>$1,000 PRIZE</h2>
          <p>Your Prize ID: #WN-29847</p>
        </div>
        <p>To claim your prize, you must provide your personal information for verification. A small processing fee of $19.99 may apply.</p>
        <p><strong>Offer expires in: 23:47:32</strong></p>
        <a href="http://winner-notification-center.com/claim" style="background:#ff6b00;color:white;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:18px;display:inline-block;">CLAIM MY PRIZE</a>
      </div>`,
      answer: 'phish',
      explanation: 'Classic "too good to be true" phishing. You cannot win a contest you never entered. "Processing fees" for prizes are scams — legitimate prizes have no fees. The urgency countdown, vague sender domain, and request for personal information are all major red flags.',
      difficulty: 'easy'
    },
    {
      subject: 'GitHub: [phishing-hunter] New pull request #47 by alex-dev',
      from: 'notifications@github.com',
      body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; color:#24292f;">
        <div style="border-bottom:1px solid #d0d7de;padding-bottom:16px;margin-bottom:16px;">
          <strong>GitHub</strong>
        </div>
        <h3>Pull Request: Add rate limiting middleware</h3>
        <p><strong>alex-dev</strong> wants to merge 3 commits into <code>main</code> from <code>feature/rate-limiting</code></p>
        <div style="background:#f6f8fa;border:1px solid #d0d7de;border-radius:6px;padding:16px;margin:16px 0;">
          <p><strong>Description:</strong></p>
          <p>This PR adds express-rate-limit middleware to prevent brute force attacks on the login endpoint. Closes #43.</p>
          <ul>
            <li>Added rate-limit config</li>
            <li>Unit tests passing</li>
            <li>Documentation updated</li>
          </ul>
        </div>
        <a href="https://github.com/notifications" style="color:#0969da;">View Pull Request</a>
        <p style="color:#57606a;font-size:12px;">You're receiving this because you're watching this repository. <a href="https://github.com/notifications/unsubscribe">Unsubscribe</a></p>
      </div>`,
      answer: 'legitimate',
      explanation: 'This is a legitimate GitHub notification. The sender is @github.com, the email contains specific technical details (branch names, PR description, issue reference), the language matches GitHub\'s standard notifications, and links go to github.com.',
      difficulty: 'hard'
    },
    {
      subject: 'Bank of America: Verify your account to avoid suspension',
      from: 'alert@bankofamerica-secure-verify.com',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="background:#e31837;padding:16px;color:white;">
          <h2>Bank of America — Security Alert</h2>
        </div>
        <div style="padding:24px;border:1px solid #ddd;">
          <p>Dear Valued Customer,</p>
          <p>Our fraud detection system has flagged <strong>suspicious transactions</strong> on your account. To protect your funds, we have placed a <strong style="color:red">temporary hold</strong> on your account.</p>
          <p>You must verify your identity within <strong>12 hours</strong> to restore access:</p>
          <ul>
            <li>Full name and date of birth</li>
            <li>Social Security Number (last 4 digits)</li>
            <li>Online banking username and password</li>
            <li>Debit card number and PIN</li>
          </ul>
          <a href="http://bankofamerica-secure-verify.com/restore" style="background:#e31837;color:white;padding:12px 28px;text-decoration:none;border-radius:4px;display:inline-block;margin-top:12px;">Restore Account Access</a>
        </div>
      </div>`,
      answer: 'phish',
      explanation: 'Extremely dangerous phishing. The domain "bankofamerica-secure-verify.com" is NOT Bank of America — it\'s "bankofamerica.com". No legitimate bank EVER asks for your password, PIN, or full SSN via email. The checklist of sensitive info requested is a major red flag.',
      difficulty: 'easy'
    },
    {
      subject: 'LinkedIn: You appeared in 8 searches this week',
      from: 'notifications-noreply@linkedin.com',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; color:#000;">
        <div style="background:#0077b5;padding:16px;color:white;">
          <strong style="font-size:20px;">in</strong><span style="font-size:16px;"> LinkedIn</span>
        </div>
        <div style="padding:24px;">
          <p>Hi there,</p>
          <p>Your profile appeared in <strong>8 searches</strong> in the past week. Viewers include people from:</p>
          <ul>
            <li>Microsoft</li>
            <li>Google</li>
            <li>Amazon</li>
          </ul>
          <p>Update your profile to stand out to recruiters.</p>
          <a href="https://www.linkedin.com/me/" style="background:#0077b5;color:white;padding:10px 24px;text-decoration:none;border-radius:24px;display:inline-block;">View Your Profile</a>
          <p style="color:#666;font-size:12px;margin-top:24px;">LinkedIn Corporation, 1000 West Maude Avenue, Sunnyvale, CA 94085. <a href="https://www.linkedin.com/e/v2">Unsubscribe</a></p>
        </div>
      </div>`,
      answer: 'legitimate',
      explanation: 'This is a legitimate LinkedIn notification. The sender domain is @linkedin.com, it doesn\'t request credentials, the link goes to linkedin.com, and the content (profile search views) matches LinkedIn\'s standard weekly notifications. LinkedIn headquarters address is accurate.',
      difficulty: 'medium'
    },
    {
      subject: 'DocuSign: Please sign your employment contract immediately',
      from: 'dse@docusign-hr-contracts.org',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="border-bottom:4px solid #F5A623;padding:16px;">
          <strong style="color:#F5A623;font-size:22px;">DocuSign</strong>
        </div>
        <div style="padding:24px;">
          <p>Hello,</p>
          <p><strong>TechCorp HR Department</strong> has sent you an employment contract for your signature.</p>
          <div style="background:#f9f9f9;border-left:4px solid #F5A623;padding:16px;margin:16px 0;">
            <p><strong>Document:</strong> Employment Agreement - Final Version.pdf</p>
            <p><strong>Expires:</strong> Today at 5:00 PM</p>
            <p><strong>Sender:</strong> hr@techcorp-hiring.com</p>
          </div>
          <p>To review and sign, you will need to verify your identity using your email and password.</p>
          <a href="http://docusign-hr-contracts.org/sign/verify" style="background:#F5A623;color:white;padding:12px 28px;text-decoration:none;border-radius:4px;display:inline-block;">Review &amp; Sign Document</a>
        </div>
      </div>`,
      answer: 'phish',
      explanation: 'The sender domain "docusign-hr-contracts.org" is not DocuSign\'s domain (docusign.com). Real DocuSign emails come from @docusign.net. Crucially, DocuSign never asks for your email password to sign documents — signing is done through a secure code sent separately. The fake urgency (expires today) is also a red flag.',
      difficulty: 'medium'
    },
    {
      subject: 'Netflix: Update your payment method to continue watching',
      from: 'info@netflix-billing-update.net',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; background:#141414; color:white; padding:24px;">
        <h2 style="color:#E50914;">NETFLIX</h2>
        <div style="background:#222;padding:20px;border-radius:8px;">
          <h3>Your membership is on hold</h3>
          <p>We're having trouble with your current billing information. We need you to update your payment details to continue your Netflix membership and avoid interruption of service.</p>
          <div style="background:#333;padding:12px;border-radius:4px;margin:16px 0;">
            <p>⚠️ Your account will be closed in <strong>48 hours</strong> if payment is not updated.</p>
          </div>
          <a href="http://netflix-billing-update.net/account/payment" style="background:#E50914;color:white;padding:12px 28px;text-decoration:none;border-radius:4px;display:inline-block;">Update Payment Now</a>
        </div>
        <p style="color:#999;font-size:11px;margin-top:16px;">Netflix Entertainment | Los Gatos, CA</p>
      </div>`,
      answer: 'phish',
      explanation: 'The sender domain is "netflix-billing-update.net" — Netflix only sends emails from @netflix.com. The threat of account closure, urgent 48-hour deadline, and link going to a non-Netflix domain are clear phishing indicators. Real Netflix billing issues are managed at netflix.com/account.',
      difficulty: 'easy'
    }
  ];

  for (const s of scenarios) {
    await conn.execute(
      `INSERT INTO scenarios (email_subject, email_from, email_body, correct_answer, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?)`,
      [s.subject, s.from, s.body, s.answer, s.explanation, s.difficulty]
    );
  }
  console.log(`✅ Seeded ${scenarios.length} sample scenarios`);
}

module.exports = { initializeDatabase };
