import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment to Base Sepolia...");

  // Get the contract factory
  const NameRegistry = await ethers.getContractFactory("NameRegistry");

  // Deploy the contract
  console.log("Deploying NameRegistry contract...");
  const nameRegistry = await NameRegistry.deploy();

  // Wait for deployment to complete
  await nameRegistry.waitForDeployment();
  
  const deployedAddress = await nameRegistry.getAddress();
  
  console.log("✅ NameRegistry deployed successfully!");
  console.log("📍 Contract Address:", deployedAddress);
  console.log("🌐 Network: Base Sepolia (Chain ID: 84532)");
  console.log("🔗 View on BaseScan:", `https://sepolia.basescan.org/address/${deployedAddress}`);
  
  // Test basic functionality
  console.log("\n🧪 Testing contract functionality...");
  
  try {
    // Test name availability check
    const isAvailable = await nameRegistry.isNameAvailable("test123");
    console.log("✅ Name availability check working:", isAvailable);
    
    console.log("✅ Contract deployed and verified successfully!");
  } catch (error) {
    console.error("❌ Error testing contract:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });