import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    // Deploy Registry
    const Registry = await ethers.getContractFactory("Registry");
    const registry = await Registry.deploy();
    await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("Registry deployed:", registryAddress);

    // Deploy Points
    const Points = await ethers.getContractFactory("Points");
    const points = await Points.deploy();
    await points.waitForDeployment();
    const pointsAddress = await points.getAddress();
    console.log("Points deployed:", pointsAddress);

    // Set deployer as awarder for Points contract
    await points.setAwarder(deployer.address);
    console.log("Points awarder set to:", deployer.address);

    // Deploy Files
    const Files = await ethers.getContractFactory("Files");
    const files = await Files.deploy();
    await files.waitForDeployment();
    const filesAddress = await files.getAddress();
    console.log("Files deployed:", filesAddress);

    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Determine network and create deployment file
    const network = await ethers.provider.getNetwork();
    const networkName = network.chainId === 31337n ? "local" : 
                       network.chainId === 84532n ? "base-sepolia" : "unknown";

    const deploymentData = {
      Registry: registryAddress,
      Points: pointsAddress,
      Files: filesAddress
    };

    const deploymentPath = path.join(deploymentsDir, `${networkName}.json`);
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log(`Deployment addresses saved to: deployments/${networkName}.json`);

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});