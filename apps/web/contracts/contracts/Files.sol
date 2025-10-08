// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Files {
    event Pinned(address indexed user, bytes32 cid);

    /**
     * @dev Pin a file by CID hash
     * @param cid The IPFS content identifier hash
     */
    function pin(bytes32 cid) public {
        emit Pinned(msg.sender, cid);
    }
}