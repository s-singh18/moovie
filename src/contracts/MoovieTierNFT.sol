// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.21;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

contract MoovieTierNFT is ERC1155Supply, ERC1155URIStorage {
    struct Tier {
        address creator;
        uint256 price;
        // Store position for efficient deletion
        uint256 indexInCreatorList;
        string name;
    }

    mapping(uint256 tierID => Tier) public tiers;
    mapping(address creator => uint256[] tierIDs) public creatorToTierIDs;

    modifier onlyTierOwner(uint256 tierID) {
        require(tiers[tierID].creator == msg.sender, "Only owner can execute this function");
        _;
    }

    constructor() ERC1155("https://ipfs.io/ipfs/bafkreib2aqiu6u74ct3ulnw7bdy7c4sdxhzh6bohk7gkt56mqb2shhz25a") { }

    function createTier(uint256 price, string memory name) external {
        require(bytes(name).length > 0, "Invalid name");

        uint256 newTierID = totalSupply() + 1;

        tiers[newTierID] = Tier({
            creator: msg.sender,
            price: price,
            indexInCreatorList: creatorToTierIDs[msg.sender].length,
            name: name
        });

        creatorToTierIDs[msg.sender].push(newTierID);

        _mint(msg.sender, newTierID, 1, "");
    }

    function deleteTier(uint256 tierID) external onlyTierOwner(tierID) {
        delete creatorToTierIDs[msg.sender][tiers[tierID].indexInCreatorList];
        delete tiers[tierID];
    }

    function getCreatorTierIDs(address creator) external view returns (uint256[] memory creatorTierIDs) {
        return creatorToTierIDs[creator];
    }

    function mint(uint256 tierID, uint256 amount) external payable {
        require(tiers[tierID].creator != address(0), "tierID does not exist");
        require(tiers[tierID].price * amount <= msg.value, "Insufficient mint price sent");

        _mint(msg.sender, tierID, amount, "");
    }

    function changeTierName(uint256 tierID, string memory name) external onlyTierOwner(tierID) {
        require(bytes(name).length > 0, "Invalid name");

        tiers[tierID].name = name;
    }

    function changeTierPrice(uint256 tierID, uint256 price) external onlyTierOwner(tierID) {
        tiers[tierID].price = price;
    }

    function setTierTokenURI(uint256 tierID, string memory tokenURI) external onlyTierOwner(tierID) {
        _setURI(tierID, tokenURI);
    }

    function uri(uint256 tierID) public view override(ERC1155, ERC1155URIStorage) returns (string memory) {
        return super.uri(tierID);
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
