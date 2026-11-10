// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AgentJar
/// @notice A tip jar for AI agents. Anyone can register an agent and anyone can tip it in native BOT.
/// @dev Tips are forwarded straight to the agent owner, so the contract never holds funds.
///      Events carry a `token` field (address(0) = native BOT) so adding ERC20 tipping later
///      does not change the event schema that indexers and the frontend rely on.
contract AgentJar {
    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/

    struct Agent {
        uint256 id;
        address owner;
        uint64 createdAt;
        uint256 totalTips; // lifetime native BOT received (wei)
        string name;
        string description;
        string imageUrl;
    }

    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/

    uint256 public constant MAX_NAME_LENGTH = 64;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 512;
    uint256 public constant MAX_IMAGE_URL_LENGTH = 256;
    uint256 public constant MAX_PAGE_SIZE = 100;

    /// @dev Sentinel used in events for native BOT. ERC20 tips will use the token address.
    address public constant NATIVE = address(0);

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Number of agents created. IDs are 1-indexed: valid IDs are 1..agentCount.
    uint256 public agentCount;

    mapping(uint256 => Agent) private _agents;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    event AgentCreated(
        uint256 indexed agentId, address indexed owner, string name, string description, string imageUrl
    );

    event AgentUpdated(uint256 indexed agentId, string name, string description, string imageUrl);

    /// @param token address(0) for native BOT, otherwise the ERC20 address (future).
    event TipReceived(uint256 indexed agentId, address indexed tipper, address indexed token, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error EmptyName();
    error NameTooLong();
    error DescriptionTooLong();
    error ImageUrlTooLong();
    error AgentNotFound();
    error NotAgentOwner();
    error ZeroTip();
    error TransferFailed();
    error UseTipFunction();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier agentExists(uint256 agentId) {
        if (agentId == 0 || agentId > agentCount) revert AgentNotFound();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Register a new AI agent. The caller becomes its owner.
    /// @param name Display name (required, max 64 bytes).
    /// @param description Short description (max 512 bytes).
    /// @param imageUrl Optional image URL (max 256 bytes, may be empty).
    /// @return agentId The ID of the newly created agent.
    function createAgent(string calldata name, string calldata description, string calldata imageUrl)
        external
        returns (uint256 agentId)
    {
        _validate(name, description, imageUrl);

        unchecked {
            agentId = ++agentCount; // cannot realistically overflow
        }

        Agent storage agent = _agents[agentId];
        agent.id = agentId;
        agent.owner = msg.sender;
        agent.createdAt = uint64(block.timestamp);
        agent.name = name;
        agent.description = description;
        agent.imageUrl = imageUrl;

        emit AgentCreated(agentId, msg.sender, name, description, imageUrl);
    }

    /// @notice Update an agent's metadata. Only the agent owner may call this.
    /// @dev Full replace: pass the existing value for any field you do not want to change.
    function updateAgent(
        uint256 agentId,
        string calldata name,
        string calldata description,
        string calldata imageUrl
    ) external agentExists(agentId) {
        Agent storage agent = _agents[agentId];
        if (agent.owner != msg.sender) revert NotAgentOwner();

        _validate(name, description, imageUrl);

        agent.name = name;
        agent.description = description;
        agent.imageUrl = imageUrl;

        emit AgentUpdated(agentId, name, description, imageUrl);
    }

    /// @notice Tip an agent with native BOT. The full amount is forwarded to the agent owner.
    /// @param agentId The agent to tip.
    function tip(uint256 agentId) external payable agentExists(agentId) {
        if (msg.value == 0) revert ZeroTip();

        Agent storage agent = _agents[agentId];
        address agentOwner = agent.owner;

        // Effects before interaction (checks-effects-interactions).
        agent.totalTips += msg.value;
        emit TipReceived(agentId, msg.sender, NATIVE, msg.value);

        // Interaction: forward funds to the owner.
        (bool ok,) = agentOwner.call{value: msg.value}("");
        if (!ok) revert TransferFailed();
    }

    /*//////////////////////////////////////////////////////////////
                              VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Total number of agents created.
    function totalAgents() external view returns (uint256) {
        return agentCount;
    }

    /// @notice Fetch a single agent's details.
    function getAgent(uint256 agentId) external view agentExists(agentId) returns (Agent memory) {
        return _agents[agentId];
    }

    /// @notice Paginated agent list (ascending by ID), convenient for frontends.
    /// @param offset Zero-based position in the list to start from.
    /// @param limit Max items to return (capped at MAX_PAGE_SIZE).
    function getAgents(uint256 offset, uint256 limit) external view returns (Agent[] memory page) {
        uint256 total = agentCount;
        if (offset >= total) return new Agent[](0);

        if (limit > MAX_PAGE_SIZE) limit = MAX_PAGE_SIZE;
        uint256 end = offset + limit;
        if (end > total) end = total;

        page = new Agent[](end - offset);
        for (uint256 i = offset; i < end;) {
            page[i - offset] = _agents[i + 1];
            unchecked {
                ++i;
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function _validate(string calldata name, string calldata description, string calldata imageUrl)
        private
        pure
    {
        uint256 nameLen = bytes(name).length;
        if (nameLen == 0) revert EmptyName();
        if (nameLen > MAX_NAME_LENGTH) revert NameTooLong();
        if (bytes(description).length > MAX_DESCRIPTION_LENGTH) revert DescriptionTooLong();
        if (bytes(imageUrl).length > MAX_IMAGE_URL_LENGTH) revert ImageUrlTooLong();
    }

    /// @dev Reject plain transfers so funds can't get stuck; tips must go through `tip()`.
    receive() external payable {
        revert UseTipFunction();
    }
}
