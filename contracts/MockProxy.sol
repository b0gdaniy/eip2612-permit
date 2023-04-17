// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Token.sol";

contract MockProxy {
    function send(
        Token tkn,
        address owner,
        address spender,
        uint value,
        uint deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        tkn.permit(owner, spender, value, deadline, v, r, s);
    }
}
