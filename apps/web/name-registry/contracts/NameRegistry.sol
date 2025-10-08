// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title NameRegistry
 * @dev Simple name registry contract for mapping names to addresses
 */
contract NameRegistry {
    mapping(string => address) private nameToOwner;
    mapping(address => string) private ownerToName;
    mapping(string => bool) private nameExists;
    
    event NameRegistered(string indexed name, address indexed owner);
    event NameTransferred(string indexed name, address indexed from, address indexed to);
    
    error NameAlreadyRegistered(string name);
    error NameNotRegistered(string name);
    error UnauthorizedAccess(address caller);
    error InvalidName(string name);
    error SoulboundViolation(address wallet, string existingName);
    
    modifier onlyNameOwner(string memory name) {
        if (nameToOwner[name] != msg.sender) {
            revert UnauthorizedAccess(msg.sender);
        }
        _;
    }
    
    modifier validName(string memory name) {
        bytes memory nameBytes = bytes(name);
        if (nameBytes.length < 3 || nameBytes.length > 32) {
            revert InvalidName(name);
        }
        
        // Check for valid characters (alphanumeric only)
        for (uint i = 0; i < nameBytes.length; i++) {
            bytes1 char = nameBytes[i];
            if (!(char >= 0x30 && char <= 0x39) && // 0-9
                !(char >= 0x61 && char <= 0x7A)) { // a-z
                revert InvalidName(name);
            }
        }
        _;
    }
    
    /**
     * @dev Register a new name to the caller's address
     * @param name The name to register (3-32 chars, alphanumeric only)
     * SOULBOUND: One wallet can only register ONE name ever
     */
    function registerName(string memory name) external validName(name) {
        if (nameExists[name]) {
            revert NameAlreadyRegistered(name);
        }
        
        // SOULBOUND ENFORCEMENT: Reject if wallet already owns a name
        string memory currentName = ownerToName[msg.sender];
        if (bytes(currentName).length > 0) {
            revert SoulboundViolation(msg.sender, currentName);
        }
        
        nameToOwner[name] = msg.sender;
        ownerToName[msg.sender] = name;
        nameExists[name] = true;
        
        emit NameRegistered(name, msg.sender);
    }
    
    /**
     * @dev Transfer name ownership to another address
     * @param name The name to transfer
     * @param to The address to transfer to
     * SOULBOUND: Recipient cannot already own a name
     */
    function transferName(string memory name, address to) external onlyNameOwner(name) {
        // SOULBOUND ENFORCEMENT: Recipient cannot already own a name
        string memory recipientCurrentName = ownerToName[to];
        if (bytes(recipientCurrentName).length > 0) {
            revert SoulboundViolation(to, recipientCurrentName);
        }
        
        // Clear sender's name mapping
        delete ownerToName[msg.sender];
        
        // Set new mappings
        nameToOwner[name] = to;
        ownerToName[to] = name;
        
        emit NameTransferred(name, msg.sender, to);
    }
    
    /**
     * @dev Get the owner of a registered name
     * @param name The name to look up
     * @return The address that owns the name
     */
    function getOwner(string memory name) external view returns (address) {
        if (!nameExists[name]) {
            revert NameNotRegistered(name);
        }
        return nameToOwner[name];
    }
    
    /**
     * @dev Get the name registered to an address
     * @param owner The address to look up
     * @return The name registered to the address
     */
    function getName(address owner) external view returns (string memory) {
        return ownerToName[owner];
    }
    
    /**
     * @dev Check if a name is available for registration
     * @param name The name to check
     * @return True if available, false if taken
     */
    function isNameAvailable(string memory name) external view validName(name) returns (bool) {
        return !nameExists[name];
    }
    
    /**
     * @dev Check if a name exists in the registry
     * @param name The name to check
     * @return True if exists, false otherwise
     */
    function nameExistsInRegistry(string memory name) external view returns (bool) {
        return nameExists[name];
    }
    
    /**
     * @dev Check if an address already owns a name (for soulbound enforcement)
     * @param owner The address to check
     * @return True if the address owns a name, false otherwise
     */
    function hasName(address owner) external view returns (bool) {
        return bytes(ownerToName[owner]).length > 0;
    }
}