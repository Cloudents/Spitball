pragma solidity ^0.4.24;

import "./SpitballToken.sol";

contract Crowdsale is Ownable {

  mapping(address => uint256) public balanceOf;

  address public beneficiary;
  uint256 public fundingGoal;
  uint256 public amountRaised;
  uint256 public deadline;
  uint256 public price;
  SpitballToken public tokenReward;
  mapping(address => bool) whitelist;

  bool public fundingGoalReached = false;
  bool public crowdsaleClosed = false;

  event GoalReached(address recipient, uint256 totalAmountRaised);
  event FundTransfer(address backer, uint256 amount, bool isContribution);


 

  /**
   * Constructor function
   *
   * Setup the owner
   */
    constructor (
      address ifSuccessfulSendTo,
      uint256 fundingGoalInEthers,
      uint256 durationInMinutes,
      uint256 etherCostOfEachToken,
      address addressOfTokenUsedAsReward
    ) 
      public 
    {
        beneficiary = ifSuccessfulSendTo;
        fundingGoal = SafeMath.mul(fundingGoalInEthers, 1 ether);
        deadline = SafeMath.add(now, SafeMath.mul(durationInMinutes, 1 minutes));
        price = SafeMath.mul(etherCostOfEachToken, 1 wei);
        tokenReward = SpitballToken(addressOfTokenUsedAsReward);
    }

    /**
      * approve user to crowdsale whitlist
      */  
    function approve(address addr) public {
        
        require(msg.sender == owner);

        whitelist[addr] = true;
    }


  /*
   *  Function implementing token sale contribution feature
   */
  function buyTokens () public payable {
    require(!crowdsaleClosed);
    require(whitelist[msg.sender]);
    uint256 amount = msg.value;
    balanceOf[msg.sender] = SafeMath.add(balanceOf[msg.sender], amount);
    amountRaised = SafeMath.add(amountRaised, amount);
    tokenReward.transfer(msg.sender, SafeMath.div(amount, price));
    emit FundTransfer(msg.sender, amount, true);
  }


  /* 
   *  Check if current block timestamp reached the deadline timestamp
   */
  modifier afterDeadline() { if (now >= deadline) _; }


  /**
   * Check if goal was reached
   *
   * Checks if the goal or time limit has been reached and ends the campaign
   */
  function checkGoalReached() public afterDeadline {
    if (amountRaised >= fundingGoal){
        fundingGoalReached = true;
        emit GoalReached(beneficiary, amountRaised);
    }
    crowdsaleClosed = true;
  }


  /**
   * Withdraw the funds
   *
   * Checks to see if goal or time limit has been reached, and if so, and the funding goal was reached,
   * sends the entire amount to the beneficiary. If goal was not reached, each contributor can withdraw
   * the amount they contributed.
   */
  function safeWithdrawal() 
    public 
    afterDeadline
 
  {
    if (!fundingGoalReached) {
      uint256 amount = balanceOf[msg.sender];
      balanceOf[msg.sender] = 0;
      if (amount > 0) {
          if (msg.sender.send(amount)) {
            emit FundTransfer(msg.sender, amount, false);
          } else {
            balanceOf[msg.sender] = amount;
          }
      }
    }

    if (fundingGoalReached && beneficiary == msg.sender) {
      if (beneficiary.send(amountRaised)) {
        emit FundTransfer(beneficiary, amountRaised, false);
      } else {
        //If we fail to send the funds to beneficiary, unlock funders balance
        fundingGoalReached = false;
      }
    }
  }
}
