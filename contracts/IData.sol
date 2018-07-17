pragma solidity ^0.4.24;

interface IData {
  function setSignatures (bytes _sig, bool flag) external;
  function getSignatures (bytes _sig) external view returns (bool);
  function getSymbol () external pure returns (string);
  function getName () external pure returns (string);
  function getDecimals () external pure returns (uint8);
  function getAmountOfTokenToMint() external pure returns (uint256);
  function getIsTransferWhitelistOnly () external view returns (bool);
  function setIsTransferWhitelistOnly (bool _flag) external;
  function getTransfersWhitelist (address WhitelistAddress) external view returns (bool);
  function setTransfersWhitelist (address _WhitelistAddress, bool _flag) external;
}