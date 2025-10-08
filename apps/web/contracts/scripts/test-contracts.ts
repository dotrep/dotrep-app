import { ethers } from "hardhat";

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Get contract addresses from deployment file
    const deployments = require("../deployments/local.json");
    
    // Connect to deployed contracts
    const Registry = await ethers.getContractFactory("Registry");
    const registry = Registry.attach(deployments.Registry);
    
    const Points = await ethers.getContractFactory("Points");
    const points = Points.attach(deployments.Points);
    
    const Files = await ethers.getContractFactory("Files");
    const files = Files.attach(deployments.Files);

    console.log("\n=== Testing Registry Contract ===");
    
    // Test Registry: Check owner before registration
    const testName = "testuser";
    let owner = await registry.ownerOf(testName);
    console.log(`Owner of '${testName}' before registration:`, owner);
    
    // Register a name
    const tx1 = await registry.register(testName);
    await tx1.wait();
    console.log(`Registered '${testName}'`);
    
    // Check owner after registration
    owner = await registry.ownerOf(testName);
    console.log(`Owner of '${testName}' after registration:`, owner);
    
    console.log("\n=== Testing Points Contract ===");
    
    // Test Points: Check total before award
    let total = await points.totalOf(deployer.address);
    console.log(`Total XP before award:`, total.toString());
    
    // Award XP
    const actionId = ethers.keccak256(ethers.toUtf8Bytes("test-action-1"));
    const tx2 = await points.award(deployer.address, 100, actionId);
    await tx2.wait();
    console.log("Awarded 100 XP");
    
    // Check total after award
    total = await points.totalOf(deployer.address);
    console.log(`Total XP after award:`, total.toString());
    
    console.log("\n=== Testing Files Contract ===");
    
    // Test Files: Pin a file (emit event)
    const fakeCid = ethers.keccak256(ethers.toUtf8Bytes("fake-ipfs-content"));
    const tx3 = await files.pin(fakeCid);
    const receipt = await tx3.wait();
    console.log("Pinned file with CID:", fakeCid);
    console.log("Transaction hash:", receipt.hash);
    
    console.log("\n=== All Tests Completed ===");
    
  } catch (error) {
    console.error("Testing failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});