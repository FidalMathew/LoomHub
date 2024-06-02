// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LoomHub {
    struct Sheet {
        uint256 id;
        address owner;
        string ipns;
        string name;
        bool published;
    }

    address public admin;
    Sheet[] public workbook;
    uint256 public nextId;

    mapping(address => uint256[]) mapId;

    constructor() {
        admin = msg.sender;
        nextId = 1;
    }

    function getId(uint256 _id) public view returns (bool) {
        uint256[] memory arr = mapId[msg.sender];
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == _id) {
                return true;
            }
        }
        return false;
    }

    function addId(uint256 id) public payable {
        require(msg.value == 0.001 ether, "You must send exactly 0.001 ETH");

        // Find the sheet with the given ID and transfer ETH to its owner
        address owner;
        bool found = false;
        for (uint256 i = 0; i < workbook.length; i++) {
            if (workbook[i].id == id) {
                owner = workbook[i].owner;
                found = true;
                break;
            }
        }

        require(found, "Sheet not found");

        // Transfer the ETH to the owner
        (bool success, ) = owner.call{value: msg.value}("");
        require(success, "Transfer failed");

        // Add the ID to the user's mapId
        mapId[msg.sender].push(id);
    }

    function publishSheet(uint256 _id) public {
        for (uint256 i = 0; i < workbook.length; i++) {
            if (workbook[i].id == _id && workbook[i].owner == msg.sender) {
                workbook[i].published = true;
                return;
            }
        }
        revert("Sheet not found or not owned by caller");
    }

    function viewAllIds() public view returns (uint256[] memory) {
        return mapId[msg.sender];
    }

    function currentId() public view returns (uint256) {
        return nextId;
    }

    function addIPNS(string memory name, string memory ipns) public {
        workbook.push(Sheet(nextId, msg.sender, ipns, name, false));
        nextId++;
    }

    function updateName(uint256 id, string memory newName) public {
        for (uint256 i = 0; i < workbook.length; i++) {
            if (workbook[i].id == id && workbook[i].owner == msg.sender) {
                workbook[i].name = newName;
                return;
            }
        }
        revert("Sheet not found or not owned by caller");
    }

    function viewAllWorkbooks() public view returns (Sheet[] memory) {
        return workbook;
    }

    function viewMyWorkbooks() public view returns (Sheet[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < workbook.length; i++) {
            if (workbook[i].owner == msg.sender) {
                count++;
            }
        }

        Sheet[] memory myWorkbooks = new Sheet[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < workbook.length; i++) {
            if (workbook[i].owner == msg.sender) {
                myWorkbooks[index] = workbook[i];
                index++;
            }
        }
        return myWorkbooks;
    }

    function viewSheetDetails(uint256 id) public view returns (Sheet memory) {
        for (uint256 i = 0; i < workbook.length; i++) {
            if (workbook[i].id == id) {
                return workbook[i];
            }
        }

        revert("Sheet not found");
    }

    function getWorkbookCount() public view returns (uint256) {
        return workbook.length;
    }

    function getSheet(uint256 index) public view returns (Sheet memory) {
        require(index < workbook.length, "Index out of bounds");
        return workbook[index];
    }

    string[] tokenHash;

    function addIPFSHash(string memory hash) public {
        require(msg.sender == admin, "You're not admin");
        tokenHash.push(hash);
    }

    function getTokenHashes() public view returns (string[] memory) {
        return tokenHash;
    }
}
