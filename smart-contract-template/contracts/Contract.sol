// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFToken.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Contract {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;

    // Contract unique identifier
    bytes private _identifier;
    // Contract parties address
    EnumerableSet.AddressSet _parties;
    // Contract deontic expression NFtoken
    NFToken public _nfToken;
    // Contract deontic expressions token id
    EnumerableSet.UintSet _deonticExpressions;
    // Contract objects token id
    EnumerableSet.UintSet _objects;
    // Contract related contracts (on chain)
    EnumerableSet.AddressSet _relatedContracts;
    // Contract related contracts relations
    mapping(address => string) public _contractRelations;
    // Contract content URI
    string public _contentUri;
    // Contract content HASH
    bytes public _contentHash;

    constructor(
        bytes memory identifier,
        address[] memory parties,
        NFToken nfToken,
        uint256[] memory deonticExpressionsIds,
        uint256[] memory objects,
        address[] memory relatedContracts,
        string[] memory relations,
        string memory contentUri,
        bytes memory contentHash
    ) {
        _identifier = identifier;
        for (uint256 i = 0; i < parties.length; i++) {
            _parties.add(parties[i]);
        }
        _nfToken = nfToken;
        for (uint256 i = 0; i < deonticExpressionsIds.length; i++) {
            _deonticExpressions.add(deonticExpressionsIds[i]);
        }
        for (uint256 i = 0; i < objects.length; i++) {
            _objects.add(objects[i]);
        }
        for (uint256 i = 0; i < relatedContracts.length; i++) {
            _relatedContracts.add(relatedContracts[i]);
            _contractRelations[relatedContracts[i]] = relations[i];
        }
        _contentUri = contentUri;
        _contentHash = contentHash;
    }

    function getParties() public view returns (address[] memory) {
        address[] memory parties = new address[](_parties.length());
        for (uint256 i = 0; i < _parties.length(); i++) {
            parties[i] = _parties.at(i);
        }

        return parties;
    }

    function getDeonticExpressions() public view returns (uint256[] memory) {
        uint256[] memory deontics = new uint256[](_deonticExpressions.length());
        for (uint256 i = 0; i < _deonticExpressions.length(); i++) {
            deontics[i] = _deonticExpressions.at(i);
        }

        return deontics;
    }

    function getObjects() public view returns (uint256[] memory) {
        uint256[] memory objects = new uint256[](_objects.length());
        for (uint256 i = 0; i < _objects.length(); i++) {
            objects[i] = _objects.at(i);
        }

        return objects;
    }

    function getRelatedContracts() public view returns (address[] memory) {
        address[] memory related = new address[](_relatedContracts.length());
        for (uint256 i = 0; i < _relatedContracts.length(); i++) {
            related[i] = _relatedContracts.at(i);
        }

        return related;
    }
}
