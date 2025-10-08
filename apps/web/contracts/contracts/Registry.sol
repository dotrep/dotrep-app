// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Registry {
    event Registered(address indexed owner, string name);

    mapping(bytes32 => address) private ownerOfHash;
    mapping(address => bool) public hasName;

    /**
     * @dev Convert ASCII A-Z to a-z (lowercase)
     */
    function _toLower(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bLower = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 65) && (uint8(bStr[i]) <= 90)) {
                bLower[i] = bytes1(uint8(bStr[i]) + 32);
            } else {
                bLower[i] = bStr[i];
            }
        }
        return string(bLower);
    }

    /**
     * @dev Get the owner of a name
     */
    function ownerOf(string calldata name) public view returns (address) {
        bytes32 key = keccak256(bytes(_toLower(name)));
        return ownerOfHash[key];
    }

    /**
     * @dev Register a name
     */
    function register(string calldata name) public {
        require(!hasName[msg.sender], "Address already has a name");
        
        string memory lowerName = _toLower(name);
        bytes memory nameBytes = bytes(lowerName);
        
        // Enforce length 3-20 characters
        require(nameBytes.length >= 3 && nameBytes.length <= 20, "Name must be 3-20 characters");
        
        // Enforce allowed characters: a-z, 0-9, -
        for (uint i = 0; i < nameBytes.length; i++) {
            uint8 char = uint8(nameBytes[i]);
            require(
                (char >= 97 && char <= 122) || // a-z
                (char >= 48 && char <= 57) ||  // 0-9
                char == 45,                    // -
                "Invalid character in name"
            );
        }
        
        bytes32 key = keccak256(nameBytes);
        require(ownerOfHash[key] == address(0), "Name already taken");
        
        ownerOfHash[key] = msg.sender;
        hasName[msg.sender] = true;
        
        emit Registered(msg.sender, lowerName);
    }
}