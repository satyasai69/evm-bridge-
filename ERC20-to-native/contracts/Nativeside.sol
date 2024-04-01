// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// Define the ERC20 interface
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract nativaLocker {
    address public owner;

     event Received(address sender, uint amount);

    modifier onlyOwner {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    constructor()   {
        owner = msg.sender;
    }


    receive() external payable {
        require(msg.value > 0, "Must send ETH");
        emit Received(msg.sender, msg.value);
    }

  

    // Function to send ETH to a specific address
    function sendETH(address payable recipient, uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Not enough ETH in contract.");
        recipient.transfer(amount);
    }

    // Function to withdraw ETH with specified receiver and amount
    function withdraw(address payable receiver, uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Not enough ETH in contract.");
        receiver.transfer(amount);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Function to withdraw all ETH from the contract
    function withdrawAll() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

  // Function to withdraw all ERC20 tokens from the contract
    function withdrawERC20(IERC20 token) public onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No ERC20 tokens to withdraw.");
        token.transfer(owner, balance);
    }

}
