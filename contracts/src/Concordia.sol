// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Concordia {
    string public eventName;
    string[5] public criteria;

    mapping(address => bool) public selectedValidators;
    mapping(address => bool) public hasSubmitted;
    uint256 public totalSubmissions;

    event ValidationSubmitted(address validator, uint256 timestamp);

    constructor(address demoValidator) {
        eventName = "Monad Blitz CDMX";
        criteria[0] = unicode"Internet funcionó";
        criteria[1] = "Espacio de trabajo adecuado";
        criteria[2] = "Comida y bebidas";
        criteria[3] = "Valor para participantes";
        criteria[4] = unicode"¿Lo financiarías otra vez?";

        selectedValidators[demoValidator] = true;
    }

    // scores: 0 = Fallo, 1 = Cumplio, 2 = Supero
    function submitValidation(uint8[5] calldata scores) external {
        require(selectedValidators[msg.sender], "No elegible");
        require(!hasSubmitted[msg.sender], "Ya enviaste tu validacion");

        for (uint i = 0; i < 5; i++) {
            require(scores[i] <= 2, "Score invalido");
        }

        hasSubmitted[msg.sender] = true;
        totalSubmissions++;

        emit ValidationSubmitted(msg.sender, block.timestamp);
    }

    function addValidator(address validator) external {
        selectedValidators[validator] = true;
    }
}
