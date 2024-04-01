// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./IERC20.sol";

contract USDT is IERC20 {
    address owner;

    constructor() {
        
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }


    event BridgeBurn(address sender, uint256 amount);


    uint public totalSupply;
    mapping(address => uint) public balanceOf;
    mapping(address => mapping(address => uint)) public allowance;
    string public name = "USDT";
    string public symbol = "USDT";
    uint8 public decimals = 18;

    function transfer(address recipient, uint amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool) {
        allowance[sender][msg.sender] -= amount;
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function mint(address recipient, uint amount) external onlyOwner {
        balanceOf[recipient] += amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function burn(uint amount) external {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
       
    }

     function Bridgeburn(uint amount) external {
        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;
       
         emit  BridgeBurn(msg.sender, amount);
    }

}
