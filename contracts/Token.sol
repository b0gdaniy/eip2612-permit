// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ERC2612.sol";

contract Token is ERC2612, Ownable {
    constructor() ERC2612("Token", "TKN") Ownable() {
        _mint(msg.sender, 100 * 10 ** decimals());
    }

    function mint(address _to, uint _amount) external onlyOwner {
        _mint(_to, _amount * 10 ** decimals());
    }
}
