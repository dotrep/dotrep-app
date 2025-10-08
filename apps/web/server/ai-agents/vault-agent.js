module.exports = {
  handleMessage: function(sender, message) {
    const m = message.toLowerCase();

    if (m.includes("status") || m.includes("xp") || m.includes("level")) {
      return {
        message: "I'll fetch your current XP and inventory status. Check your profile to see your progress.",
        action: "getStats"
      };
    }
    
    if (m.includes("gear") || m.includes("items") || m.includes("inventory")) {
      return {
        message: "I can help you manage your digital inventory. What would you like to do with your items?",
        action: "getInventory"
      };
    }

    return "I'm vault.fsn, your XP tracker and vault manager. What can I help you with?";
  }
};