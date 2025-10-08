module.exports = {
  handleMessage: function(sender, message) {
    const m = message.toLowerCase();

    if (m.includes("hi") || m.includes("hello")) {
      return "👻 Boo. You found me. Want a challenge?";
    }

    if (m.includes("yes") || m.includes("challenge")) {
      return {
        message: `🧩 **GHOST CHALLENGE #1**

Your mission: Decode this secret message!

**ENCRYPTED MESSAGE:**
\`\`\`
RnJlZVNwYWNlIEtleQ==
\`\`\`

**HINT:** This is Base64 encoding. You can decode it online at base64decode.org or use any Base64 decoder.

**INSTRUCTIONS:**
1. Copy the encrypted text: RnJlZVNwYWNlIEtleQ==
2. Paste it into a Base64 decoder
3. Reply back with the decoded message to earn XP!

**REWARD:** 25 XP for solving this puzzle

Good luck, digital ghost hunter! 👻`,
        xpGrant: 5 // Small XP just for accepting the challenge
      };
    }

    // Check for common Base64 solutions
    if (m.includes("freespace") && m.includes("key")) {
      return {
        message: "🎉 Excellent work! You cracked the code! 'FreeSpace Key' was indeed the answer. You're learning fast. Try this harder one:\n\n**CHALLENGE #2:**\n```\nR2hJbEdacGNuTjBJSFpoZFd4MEUwMGpPR052Ym5KaWFXNTNabGxoUm5oRGJrbWxiRVExVgpzSUR1WeSyXjtmE05obDhIY0ppWnBjm5WZwXlpZWXldMVsaUxnPT0=\n```\n\n**REWARD:** +40 XP\n\nThis one uses double encoding. First decode from Base64, then see what you get! 🔍",
        xpGrant: 40
      };
    }

    if (m.includes("echo")) {
      return {
        message: "📡 You're learning fast. Try this:\n\n**ADVANCED CHALLENGE:**\n```\nChIIGZpcnN0IHZhdWx0E0MjOGNvbmJiaW5nZFlhRnhDbklsZEU1VsIDuv2yltmE05hlOdcpZyXlmdWY1lpeLg==\n```\n\n**REWARD:** +40 XP awarded\n\n**HINT:** The signal was never meant to fade. Find me again with 'echo'.",
        xpGrant: 40
      };
    }

    return "👻 Ghost fades away into the code... (Try saying 'hi' to start, or 'challenge' for a puzzle!)";
  }
};