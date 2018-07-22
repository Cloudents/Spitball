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


    /**
    * @dev Set the signature for nonces of performed transactions 
    * @param _sig Signature defined by owner
    * @param flag Boolean value
    */
    function setSignatures 
    (
        bytes _sig, 
        bool flag
    ) 
      external
    {
        signatures[_sig] = flag;
    }


    /**
    * @dev Get the signature for nonces of performed transactions 
    * @param _sig Signature defined by owner
    */
    function getSignatures 
    (
        bytes _sig
    ) 
      external 
      view 
      returns (bool)
    {
        return signatures[_sig];
    }
    

    /**
    * @dev Allow/Disallow whitelisted transfers
    * @param _flag Boolean value defining status of white listed transfers allowance
    */
    function setIsTransferWhitelistOnly 
    (
        bool _flag
    ) 
      external
    {
        isTransferWhitelistOnly = _flag;
    }

    /**
    * @dev Check if some address is whitelisted
    * @param _WhitelistAddress address of user who will be checked for appearance in whitelist
    */
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
    

    /**
    * @dev Set the whitelist parameter for some address
    * @param _WhitelistAddress address to which will be applied whitelist
    * @param _flag Boolean value defining if user is whitelisted or no
    */
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
