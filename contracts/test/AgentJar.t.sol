// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {AgentJar} from "../src/AgentJar.sol";

/// @dev Contract without a receive/fallback: any BOT sent to it reverts.
contract RejectsEther {
    function create(AgentJar jar) external returns (uint256) {
        return jar.createAgent("Stubborn", "", "");
    }
}

contract AgentJarTest is Test {
    AgentJar internal jar;
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");

    event AgentCreated(
        uint256 indexed agentId, address indexed owner, string name, string description, string imageUrl
    );
    event AgentUpdated(uint256 indexed agentId, string name, string description, string imageUrl);
    event TipReceived(uint256 indexed agentId, address indexed tipper, address indexed token, uint256 amount);

    function setUp() public {
        jar = new AgentJar();
        vm.deal(bob, 1_000 ether);
    }

    function _create() internal returns (uint256 id) {
        vm.prank(alice);
        id = jar.createAgent("Scout", "Research agent", "https://example.com/a.png");
    }

    function test_CreateAgent() public {
        vm.expectEmit(true, true, false, true);
        emit AgentCreated(1, alice, "Scout", "Research agent", "https://example.com/a.png");
        uint256 id = _create();

        assertEq(id, 1);
        assertEq(jar.totalAgents(), 1);

        AgentJar.Agent memory a = jar.getAgent(1);
        assertEq(a.id, 1);
        assertEq(a.owner, alice);
        assertEq(a.createdAt, uint64(block.timestamp));
        assertEq(a.totalTips, 0);
        assertEq(a.name, "Scout");
    }

    function test_CreateAgent_AllowsEmptyDescriptionAndImage() public {
        vm.prank(alice);
        jar.createAgent("Minimal", "", "");
        assertEq(jar.getAgent(1).imageUrl, "");
    }

    function test_CreateAgent_RevertsOnEmptyName() public {
        vm.expectRevert(AgentJar.EmptyName.selector);
        jar.createAgent("", "d", "");
    }

    function test_CreateAgent_RevertsOnLongFields() public {
        vm.expectRevert(AgentJar.NameTooLong.selector);
        jar.createAgent(string(new bytes(65)), "", "");

        vm.expectRevert(AgentJar.DescriptionTooLong.selector);
        jar.createAgent("n", string(new bytes(513)), "");

        vm.expectRevert(AgentJar.ImageUrlTooLong.selector);
        jar.createAgent("n", "", string(new bytes(257)));
    }

    function test_UpdateAgent_ByOwner() public {
        uint256 id = _create();

        vm.expectEmit(true, false, false, true);
        emit AgentUpdated(id, "Scout v2", "Better", "");
        vm.prank(alice);
        jar.updateAgent(id, "Scout v2", "Better", "");

        AgentJar.Agent memory a = jar.getAgent(id);
        assertEq(a.name, "Scout v2");
        assertEq(a.owner, alice);
    }

    function test_UpdateAgent_RevertsForNonOwner() public {
        uint256 id = _create();
        vm.prank(bob);
        vm.expectRevert(AgentJar.NotAgentOwner.selector);
        jar.updateAgent(id, "x", "", "");
    }

    function test_Tip_ForwardsToOwnerAndTracksTotal() public {
        uint256 id = _create();
        uint256 before = alice.balance;

        vm.expectEmit(true, true, true, true);
        emit TipReceived(id, bob, address(0), 2 ether);
        vm.prank(bob);
        jar.tip{value: 2 ether}(id);

        assertEq(alice.balance - before, 2 ether);
        assertEq(address(jar).balance, 0);
        assertEq(jar.getAgent(id).totalTips, 2 ether);
    }

    function test_Tip_RevertsOnZeroValue() public {
        uint256 id = _create();
        vm.prank(bob);
        vm.expectRevert(AgentJar.ZeroTip.selector);
        jar.tip(id);
    }

    function test_Tip_RevertsOnUnknownAgent() public {
        vm.prank(bob);
        vm.expectRevert(AgentJar.AgentNotFound.selector);
        jar.tip{value: 1 ether}(1);

        vm.prank(bob);
        vm.expectRevert(AgentJar.AgentNotFound.selector);
        jar.tip{value: 1 ether}(0);
    }

    function test_Tip_RevertsWhenOwnerRejectsEther() public {
        RejectsEther stubborn = new RejectsEther();
        uint256 id = stubborn.create(jar);

        vm.prank(bob);
        vm.expectRevert(AgentJar.TransferFailed.selector);
        jar.tip{value: 1 ether}(id);

        assertEq(jar.getAgent(id).totalTips, 0);
    }

    function test_DirectTransferReverts() public {
        vm.prank(bob);
        (bool ok,) = address(jar).call{value: 1 ether}("");
        assertFalse(ok);
    }

    function test_GetAgent_RevertsOnUnknownId() public {
        vm.expectRevert(AgentJar.AgentNotFound.selector);
        jar.getAgent(1);
    }

    function test_GetAgents_Pagination() public {
        _create();
        _create();
        _create();

        AgentJar.Agent[] memory page = jar.getAgents(1, 10);
        assertEq(page.length, 2);
        assertEq(page[0].id, 2);
        assertEq(page[1].id, 3);

        assertEq(jar.getAgents(5, 10).length, 0);
        assertEq(jar.getAgents(0, 2).length, 2);
    }

    function testFuzz_TipsAccumulate(uint96 a, uint96 b) public {
        a = uint96(bound(a, 1, 100 ether));
        b = uint96(bound(b, 1, 100 ether));
        uint256 id = _create();

        vm.startPrank(bob);
        jar.tip{value: a}(id);
        jar.tip{value: b}(id);
        vm.stopPrank();

        assertEq(jar.getAgent(id).totalTips, uint256(a) + uint256(b));
        assertEq(address(jar).balance, 0);
    }
}
