pragma solidity ^0.5.2;

import {Oracle} from './Oracle.sol';

contract OracleResolver {
    address owner;

    address public oracleAddress;

    constructor () public {
        owner = msg.sender;
    }

    function setOracleAddress(address _addr) public {
        oracleAddress = _addr;
    }
    
    function getOracleAddress() public view returns(address) {
        return oracleAddress;
    }
}