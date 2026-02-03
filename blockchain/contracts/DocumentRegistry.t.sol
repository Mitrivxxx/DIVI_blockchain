// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {DocumentRegistry} from "./DocumentRegistry.sol";
import {Test} from "forge-std/Test.sol";

contract DocumentRegistryTest is Test {
  DocumentRegistry registry;

  function setUp() public {
    registry = new DocumentRegistry();
  }

  function test_InitialDoesNotExist() public view {
    bytes32 hash = keccak256("doc");
    require(!registry.exists(hash), "Document should not exist initially");
  }

  function test_RegisterStoresData() public {
    bytes32 hash = keccak256("doc");
    vm.warp(1_700_000_000);

    registry.register(hash);

    require(registry.exists(hash), "Document should exist after register");
    (address issuer, uint256 timestamp) = registry.get(hash);
    require(issuer == address(this), "Issuer should be msg.sender");
    require(timestamp == 1_700_000_000, "Timestamp should match block time");
  }

  function test_RegisterEmitsEvent() public {
    bytes32 hash = keccak256("doc-event");
    vm.warp(1_700_000_123);

    vm.expectEmit(true, true, false, true);
    emit DocumentRegistry.DocumentRegistered(hash, address(this), 1_700_000_123);
    registry.register(hash);
  }

  function test_RegisterRejectsZeroHash() public {
    vm.expectRevert("Invalid hash");
    registry.register(bytes32(0));
  }

  function test_RegisterRejectsDuplicate() public {
    bytes32 hash = keccak256("dup");
    registry.register(hash);

    vm.expectRevert("Already registered");
    registry.register(hash);
  }

  function test_GetRejectsMissing() public {
    bytes32 hash = keccak256("missing");
    vm.expectRevert("Not found");
    registry.get(hash);
  }
}
