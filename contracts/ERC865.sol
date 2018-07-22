pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC865Token Token
 *
 * ERC865Token allows users paying transfers in tokens instead of gas
 * https://github.com/ethereum/EIPs/issues/865
 *
 */

contract ERC865 is ERC20 {

    
    /**
    * @dev Definition of submit presigned transfer function
    * @param _signature bytes The signature, issued by the owner.
    * @param _to address The address which you want to transfer to.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    */
    function transferPreSigned
    (
        bytes _signature,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
      public
        returns (bool);


    /**
    * @dev Definition of submit presigned approval function
    * @param _signature bytes The signature, issued by the owner.
    * @param _spender address The address which will spend the funds.
    * @param _value uint256 The amount of tokens to allow.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    */
    function approvePreSigned
    (
        bytes _signature,
        address _spender,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
      public
        returns (bool);


    /**
    * @dev Definition of submit presigned increase approval amount function
    * @param _signature bytes The signature, issued by the owner.
    * @param _spender address The address which will spend the funds.
    * @param _addedValue uint256 The amount of tokens to increase the allowance by.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    */
    function increaseApprovalPreSigned
    (
        bytes _signature,
        address _spender,
        uint256 _addedValue,
        uint256 _fee,
        uint256 _nonce
    )
      public
        returns (bool);


    /**
    * @dev Definition of submit presigned decrease approval amount function
    * @param _signature bytes The signature, issued by the owner
    * @param _spender address The address which will spend the funds.
    * @param _subtractedValue uint256 The amount of tokens to decrease the allowance by.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
    * @param _nonce uint256 Presigned transaction number.
    */
    function decreaseApprovalPreSigned
    (
        bytes _signature,
        address _spender,
        uint256 _subtractedValue,
        uint256 _fee,
        uint256 _nonce
    )
      public
        returns (bool);


    /**
    * @dev Definition of submit presigned transfer from function
    * @param _signature bytes The signature, issued by the spender.
    * @param _from address The address which you want to send tokens from.
    * @param _to address The address which you want to transfer to.
    * @param _value uint256 The amount of tokens to be transferred.
    * @param _fee uint256 The amount of tokens paid to msg.sender, by the spender.
    * @param _nonce uint256 Presigned transaction number.
    */
    function transferFromPreSigned
    (
        bytes _signature,
        address _from,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
      public
        returns (bool);
}
