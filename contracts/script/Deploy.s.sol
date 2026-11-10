// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentJar} from "../src/AgentJar.sol";

contract Deploy is Script {
    function run() external returns (AgentJar jar) {
        vm.startBroadcast();
        jar = new AgentJar();
        vm.stopBroadcast();
        console.log("AgentJar deployed at:", address(jar));
    }
}
