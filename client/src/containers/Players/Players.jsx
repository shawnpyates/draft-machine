import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { SelectionList, Table } from '../../components';

import { updatePlayer } from '../../actions';

import { playersTable as playersTableTexts, positions } from '../../../texts.json';

const mapDispatchToProps = dispatch => ({
  updatePlayerPropFn: args => dispatch(updatePlayer(args)),
});

const extractDataForDisplay = players => (
  players.map((player) => {
    const {
      uuid,
      name,
      email,
      position,
    } = player;
    return {
      uuid,
      name,
      email: email || '(Unprovided)',
      position,
    };
  })
);

class Players extends Component {
  assignPlayerToTeam = (playerId) => {
    const {
      draft,
      socket,
      updatePlayerPropFn,
    } = this.props;
    const { currentlySelectingTeamId } = draft;
    updatePlayerPropFn({
      id: playerId,
      body: { teamId: currentlySelectingTeamId },
      socket,
      draftId: draft.uuid,
    });
  }

  render() {
    const {
      players,
      parent,
      teamId,
      draft,
      displayType,
    } = this.props;
    const {
      type,
      title,
      noPlayersOnTeam,
      noPlayersInDraft,
      columnHeaders,
    } = playersTableTexts;
    const addNewLink = (
      parent === 'team'
        ? `/teams/${teamId}/createPlayers`
        : `/drafts/${draft.uuid}/createPlayers`
    );
    const nonSelectedPlayers = (
      parent === 'draft'
      && players.filter(player => !player.teamId)
    );
    return (
      players &&
        <div>
          {displayType === 'table' &&
            <Table
              type={type}
              title={title}
              columnHeaders={columnHeaders}
              data={extractDataForDisplay(players)}
              emptyDataMessage={parent === 'team' ? noPlayersOnTeam : noPlayersInDraft}
              addNewLink={addNewLink}
            />
          }
          {displayType === 'selectionList' &&
            <SelectionList
              type={type}
              title={title}
              data={extractDataForDisplay(nonSelectedPlayers || players)}
              emptyDataMessage={noPlayersInDraft}
              positions={positions}
              assignPlayerToTeam={this.assignPlayerToTeam}
            />
          }
        </div>
    );
  }
}

Players.defaultProps = {
  players: null,
  teamId: null,
  draft: null,
  socket: null,
  draftSocketId: null,
  displayType: 'table',
};

Players.propTypes = {
  players: PropTypes.arrayOf(PropTypes.object),
  displayType: PropTypes.string,
  parent: PropTypes.string.isRequired,
  updatePlayerPropFn: PropTypes.func.isRequired,
  teamId: PropTypes.string,
  draft: PropTypes.objectOf(PropTypes.any),
  socket: PropTypes.objectOf(PropTypes.any),
  draftSocketId: PropTypes.string,
};

export default connect(null, mapDispatchToProps)(Players);
