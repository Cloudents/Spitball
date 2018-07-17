pragma solidity ^0.4.24;

import "./ERC865Token.sol";

contract SpitballToken is ERC865Token {


    event UserAllowedToTransfer(address user);

    event TransferWhitelistOnly(bool flag);

    constructor (address _eternalStorage) ERC865Token (_eternalStorage) public { }
    /**
     * @notice Is the address allowed to transfer
     * @return true if the sender can transfer
     */
    function isUserAllowedToTransfer(address _user) public view returns (bool) {
        require(_user != 0x0);
        return interfaceData.getTransfersWhitelist(_user);
    }

    /**
     * @notice Enabling / Disabling transfers of non whitelisted users
     */
    function setWhitelistedOnly(bool _isWhitelistOnly) onlyOwner public {
       // bool temp = interfaceData.getIsTransferWhitelistOnly();
        if (interfaceData.getIsTransferWhitelistOnly() != _isWhitelistOnly) {
            interfaceData.setIsTransferWhitelistOnly(_isWhitelistOnly);
            emit TransferWhitelistOnly(_isWhitelistOnly);
        }
    }

    /**
     * @notice Adding a user to the whitelist
     */
    function whitelistUserForTransfers(address _user) onlyOwner public {
        require(!isUserAllowedToTransfer(_user));
        interfaceData.setTransfersWhitelist(_user, true);
        emit UserAllowedToTransfer(_user);
    }

    /**
     * @notice Remove a user from the whitelist
     */
    function blacklistUserForTransfers(address _user) onlyOwner public {
        require(isUserAllowedToTransfer(_user));
        interfaceData.setTransfersWhitelist(_user, false);
        emit UserAllowedToTransfer(_user);
    }
    
  /**
    * @notice transfer token for a specified address
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public returns (bool) {
        if (interfaceData.getIsTransferWhitelistOnly()) {
            require(isUserAllowedToTransfer(msg.sender));
      }
        return super.transfer(_to, _value);
    }

    /**
     * @notice Transfer tokens from one address to another
     * @param _from address The address which you want to send tokens from
     * @param _to address The address which you want to transfer to
     * @param _value uint256 the amount of tokens to be transferred
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        if (interfaceData.getIsTransferWhitelistOnly()) {
            require(isUserAllowedToTransfer(_from));
        }
        return super.transferFrom(_from, _to, _value);
    }

     /**
     * @notice Submit a presigned transfer
     * @param _signature bytes The signature, issued by the owner.
     * @param _to address The address which you want to transfer to.
     * @param _value uint256 The amount of tokens to be transferred.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function transferPreSigned(
        bytes _signature,
        address _to,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        whenNotPaused 
        //pure // test
        public
        returns (bool)
    {
        if (interfaceData.getIsTransferWhitelistOnly()) {
            bytes32 hashedTx = super.transferPreSignedHashing(address(this), _to, _value, _fee, _nonce);
            address from = recover(hashedTx, _signature);
            require(isUserAllowedToTransfer(from));
            
        }
        return super.transferPreSigned(_signature, _to, _value, _fee, _nonce);
      
    }

    /**
     * @notice Submit a presigned approval
     * @param _signature bytes The signature, issued by the owner.
     * @param _spender address The address which will spend the funds.
     * @param _value uint256 The amount of tokens to allow.
     * @param _fee uint256 The amount of tokens paid to msg.sender, by the owner.
     * @param _nonce uint256 Presigned transaction number.
     */
    function approvePreSigned(
        bytes _signature,
        address _spender,
        uint256 _value,
        uint256 _fee,
        uint256 _nonce
    )
        whenNotPaused
        public
        returns (bool)
    {
        if (interfaceData.getIsTransferWhitelistOnly()) {
            bytes32 hashedTx = super.approvePreSignedHashing(address(this), _spender, _value, _fee, _nonce);
            address from = recover(hashedTx, _signature);
            require(isUserAllowedToTransfer(from));
        }
        return super.approvePreSigned(_signature, _spender, _value, _fee, _nonce);
    }
    

}
