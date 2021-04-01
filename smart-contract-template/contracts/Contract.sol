// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NFToken.sol";
import "./EnumerableMapAddressToUint.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

//import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Contract {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableMap for EnumerableMap.AddressToUintMap;

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
    // Contract relations with other contracts
    EnumerableMap.AddressToUintMap _contractRelations;
    // Contract related income percentages for payments
    mapping(address => EnumerableMap.AddressToUintMap) _incomePercentages;
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
        uint256[] memory relations,
        address[] memory incomeBeneficiaries,
        uint256[] memory incomePercentages,
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
            _contractRelations.set(relatedContracts[i], relations[i]);
        }
        for (uint256 i = 0; i < incomePercentages.length; ) {
            EnumerableMap.AddressToUintMap storage incomeMap =
                _incomePercentages[incomeBeneficiaries[i]];
            uint256 shares = incomePercentages[i++];
            for (uint256 j = 0; j < shares; j++) {
                incomeMap.set(incomeBeneficiaries[i], incomePercentages[i++]);
            }
        }
        _contentUri = contentUri;
        _contentHash = contentHash;
    }

    function payTo(address payable beneficiary, uint256 amount) public payable {
        uint256 finalAmount = amount;
        uint256 l = _incomePercentages[beneficiary].length();
        if (l != 0) {
            for (uint256 i = 0; i < l; i++) {
                (address incomeBeneficiary, uint256 incomePercentage) =
                    _incomePercentages[beneficiary].at(i);
                uint256 subAmount = amount.mul(incomePercentage).div(100);
                payTo(payable(incomeBeneficiary), subAmount);
                finalAmount = finalAmount.sub(subAmount);
            }
        }
        beneficiary.transfer(finalAmount);
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

    function getContractRelations()
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        return _contractRelations.getAll();
    }

    function getIncomePercentagesBy(address sharer)
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        return _incomePercentages[sharer].getAll();
    }
}
