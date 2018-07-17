pragma solidity ^0.4.24;

import "./IData.sol";

contract ERC865Database is IData {

  //ERC865Token
  mapping(bytes => bool) signatures;
  mapping (address => bool) transfersWhitelist;

  string public constant symbol = "SBL";
  string public constant name = "Spitball Token";
  uint8 public constant decimals = 18;
  uint256 public constant amountOfTokenToMint = 10 ** 9 * 10 ** uint256(decimals);
  bool public isTransferWhitelistOnly = false;


  function setSignatures 
  (
    bytes _sig, 
    bool flag
  ) 
    external
  {
      signatures[_sig] = flag;
  }


  function getSignatures 
  (
    bytes _sig
  ) 
    external 
    view 
    returns (bool)
  {
      return  signatures[_sig];
  }


  function getSymbol () 
    external 
    pure 
    returns (string)
  {
      return symbol;
  }
   

  function getName () 
    external 
    pure 
    returns (string)
  {
      return name;
  }


  function getDecimals ()
    external 
    pure 
    returns (uint8)
  {
      return decimals;
  }


  function getAmountOfTokenToMint() 
    external 
    pure 
    returns (uint256)
  {
      return amountOfTokenToMint;
  }


  function getIsTransferWhitelistOnly () 
    external 
    view 
    returns (bool)
  {
      return isTransferWhitelistOnly;
  }
  


  function setIsTransferWhitelistOnly 
  (
    bool _flag
  ) 
    external
  {
      isTransferWhitelistOnly = _flag;
  }
  

  function getTransfersWhitelist 
  (
    address _WhitelistAddress
  )
    external 
    view 
    returns (bool)
  {
      return transfersWhitelist[_WhitelistAddress];
  }
  

  function setTransfersWhitelist 
  (
    address _WhitelistAddress, 
    bool _flag
  ) 
    external
  {
      transfersWhitelist[_WhitelistAddress] = _flag;
  }
}
