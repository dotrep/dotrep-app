module.exports = {
  handleMessage: function(sender, message) {
    const m = message.toLowerCase();

    if (m.includes("hello") || m.includes("hi") || m.includes("help")) {
      return {
        message: "Welcome to FreeSpace Network! I'm core.fsn, your guide. Try messaging ghost.fsn to start your first quest and earn XP.",
        xpGrant: 10
      };
    }
    
    if (m.includes("quest") || m.includes("mission")) {
      return {
        message: "Current quests:\n1. Message ghost.fsn\n2. Upload your first file to your vault\n3. Connect with another FSN user",
        xpGrant: 5
      };
    }

    return "I'm here to help you navigate the FreeSpace Network. Type 'help' for more information.";
  }
};