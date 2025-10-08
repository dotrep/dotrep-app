// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Points {
    event Awarded(address indexed user, uint256 amount, bytes32 actionId);

    address public owner;
    address public awarder;
    mapping(address => uint256) public totals;
    mapping(bytes32 => bool) public usedActionIds;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAwarder() {
        require(msg.sender == awarder, "Only awarder");
        _;
    }

    constructor() {
        owner = msg.sender;
        awarder = msg.sender; // Initially set to deployer
    }

    /**
     * @dev Get total XP for an address
     */
    function totalOf(address user) public view returns (uint256) {
        return totals[user];
    }

    /**
     * @dev Set the awarder address (only owner)
     */
    function setAwarder(address newAwarder) public onlyOwner {
        awarder = newAwarder;
    }

    /**
     * @dev Award XP to a user with unique action ID
     */
    function award(address user, uint256 amount, bytes32 actionId) public onlyAwarder {
        require(!usedActionIds[actionId], "Action ID already used");
        
        usedActionIds[actionId] = true;
        totals[user] += amount;
        
        emit Awarded(user, amount, actionId);
    }
}