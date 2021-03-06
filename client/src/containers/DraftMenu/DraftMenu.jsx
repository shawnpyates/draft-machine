import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';

import ProfileCard from '../../components/ProfileCard/ProfileCard';
import { draft as draftProfileData } from '../../components/ProfileCard/profileCardConstants.json';

import Players from '../Players/Players';
import Requests from '../Requests/Requests';
import Teams from '../Teams/Teams';

import {
  Button,
  ErrorIndicator,
  LoadingIndicator,
  Timer,
} from '../../components';

import {
  fetchOneDraft,
  updateDraft,
  updatePlayer,
  removeCurrentDraftFromState,
} from '../../actions';

import {
  BlurContainer,
  DraftMenuContainer,
  InfoContainer,
  InfoText,
} from './styledComponents';

import { getTextWithInjections } from '../../helpers';

import {
  errors as ERROR_TEXTS,
  draftInfoTexts,
  draftButtonOpenText as DRAFT_BUTTON_OPEN_TEXT,
} from '../../texts.json';
import { setDraftInfoText } from '../../actions/draftActions';

const {
  draftStarting: DRAFT_STARTING,
  draftSelection: DRAFT_SELECTION,
  draftRandomAssignment: DRAFT_RANDOM_ASSIGNMENT,
  draftCannotStart: DRAFT_CANNOT_START,
} = draftInfoTexts;

const DRAFT_STATUSES = {
  UNSCHEDULED: 'unscheduled',
  SCHEDULED: 'scheduled',
  OPEN: 'open',
};

const DISPLAY_TYPES = {
  TABLE: 'table',
  SELECTION_LIST: 'selectionList',
};

const { properties: profileProperties, values: profileValues } = draftProfileData;

const { unscheduled: DRAFT_UNSCHEDULED } = profileValues;

const mapStateToProps = (state) => {
  const { draft, socket: socketState, user } = state;
  const {
    currentDraft,
    draftInfoText,
    shouldDraftViewBlur,
    fetching: isFetchingDraft,
    isRefetch: isRefetchOfDraft,
  } = draft;
  const { socket } = socketState;
  const { currentUser } = user;
  return {
    currentDraft,
    draftInfoText,
    socket,
    currentUser,
    shouldDraftViewBlur,
    isFetchingDraft,
    isRefetchOfDraft,
  };
};

const mapDispatchToProps = (dispatch, ownProps) => {
  const { id } = ownProps.match.params;
  return {
    fetchOneDraftPropFn: (message, isRefetch) => dispatch(fetchOneDraft(id, message, isRefetch)),
    setDraftInfoTextPropFn: message => dispatch(setDraftInfoText({ message })),
    updateDraftPropFn: (body, socket) => dispatch(updateDraft({ id, body, socket })),
    updatePlayerPropFn: args => dispatch(updatePlayer(args)),
    removeCurrentDraftFromState: () => dispatch(removeCurrentDraftFromState()),
  };
};

class DraftMenu extends Component {
  constructor() {
    super();
    this.state = {
      shouldOpenButtonRender: false,
      isSocketStarted: false,
      hasDraftStarted: false,
      lastSelectingTeam: null,
      parsedTimeChange: null,
      timeScheduledReadable: null,
    };
  }

  componentDidMount() {
    const {
      fetchOneDraftPropFn,
    } = this.props;
    fetchOneDraftPropFn();
  }

  componentDidUpdate(prevProps) {
    const {
      currentDraft,
      socket,
      draftInfoText,
      isFetchingDraft,
    } = this.props;
    const { isSocketStarted } = this.state;
    if (currentDraft && !isFetchingDraft) {
      const now = new Date().toISOString();
      const { status, timeScheduled } = currentDraft;
      if (
        status === DRAFT_STATUSES.SCHEDULED
        && timeScheduled < now
        && !draftInfoText
      ) {
        this.handleScheduledArrival(currentDraft);
      }
      if (!isSocketStarted) {
        this.listenForSocketEvents(socket);
      }
      const { currentDraft: previousDraft } = prevProps;
      this.parseDraftDates(currentDraft, previousDraft);
    }
  }

  componentWillUnmount() {
    this.props.removeCurrentDraftFromState();
  }

  handleScheduledArrival = ({ Teams: teams, Players: players }) => {
    const { setDraftInfoTextPropFn } = this.props;
    if (teams && !teams.length) {
      setDraftInfoTextPropFn(getTextWithInjections(DRAFT_CANNOT_START, { resourceName: 'teams' }));
    } else if (players && !players.length) {
      setDraftInfoTextPropFn(
        getTextWithInjections(DRAFT_CANNOT_START, { resourceName: 'players' }),
      );
    } else {
      this.renderOpenButtonForOwner();
    }
  }


  parseDraftDates = (currentDraft, previousDraft) => {
    const {
      selectingTeamChangeTime: currentChangeTime,
      timeScheduled: currentTimeScheduled,
    } = currentDraft || {};
    const {
      selectingTeamChangeTime: previousChangeTime,
      timeScheduled: previousTimeScheduled,
    } = previousDraft || {};
    if (currentChangeTime && (!previousDraft || previousChangeTime !== currentChangeTime)) {
      this.setState({ parsedTimeChange: Date.parse(currentChangeTime) });
    }
    if (
      currentTimeScheduled
      && (!previousDraft || previousTimeScheduled !== currentTimeScheduled)
    ) {
      this.setState({
        timeScheduledReadable: dayjs(currentTimeScheduled).format('MMM D YYYY, h:mm a'),
      });
    }
  }

  assignPlayerToTeam = (playerId) => {
    const {
      currentDraft,
      socket,
      updatePlayerPropFn,
    } = this.props;
    const { Players: players, Teams: teams } = currentDraft;
    // team is assigned random player if they don't make selection in time
    let randomPlayerId;
    if (!playerId) {
      const filteredPlayers = players.filter(player => !player.teamId);
      randomPlayerId = (
        filteredPlayers[Math.floor(Math.random() * filteredPlayers.length)].uuid
      );
    }
    const { currentlySelectingTeamId } = currentDraft;
    const { name: teamName } = teams.find(team => team.uuid === currentlySelectingTeamId);
    const { name: playerName } = players.find(player => (
      player.uuid === (playerId || randomPlayerId)
    ));
    updatePlayerPropFn({
      id: playerId || randomPlayerId,
      body: { teamId: currentlySelectingTeamId },
      socket,
      draftId: currentDraft.uuid,
      teamName,
      playerName,
      isRandomAssignment: !!randomPlayerId,
    });
  }

  listenForSocketEvents = (socket) => {
    this.setState({ isSocketStarted: true });
    const {
      currentDraft,
      fetchOneDraftPropFn,
    } = this.props;
    const { uuid: currentDraftId } = currentDraft || {};
    socket.on('broadcastDraftSelection', ({
      draftId,
      teamName,
      playerName,
      isRandomAssignment,
    }) => {
      const { currentlySelectingTeamId } = this.props.currentDraft;
      if (
        this.state.lastSelectingTeam !== currentlySelectingTeamId
        && currentDraftId === draftId
      ) {
        this.setState({ lastSelectingTeam: currentlySelectingTeamId }, () => {
          const message = getTextWithInjections(
            isRandomAssignment ? DRAFT_RANDOM_ASSIGNMENT : DRAFT_SELECTION,
            { teamName, playerName },
          );
          fetchOneDraftPropFn(message, true);
        });
      }
    });
    socket.on('broadcastDraftStart', ({ draftId }) => {
      if (!this.state.hasDraftStarted && currentDraftId === draftId) {
        this.setState({ shouldOpenButtonRender: false, hasDraftStarted: true }, () => {
          fetchOneDraftPropFn(DRAFT_STARTING);
        });
      }
    });
  }

  openDraft = () => {
    const {
      currentDraft: {
        Teams: teams,
      },
      updateDraftPropFn,
      socket,
    } = this.props;
    updateDraftPropFn(
      {
        status: DRAFT_STATUSES.OPEN,
        currentlySelectingTeamId: teams[0].uuid,
      },
      socket,
    );
  }

  renderOpenButtonForOwner = () => {
    const { currentDraft, currentUser } = this.props;
    const { shouldOpenButtonRender } = this.state;
    if (currentDraft.ownerUserId === currentUser.uuid && !shouldOpenButtonRender) {
      this.setState({ shouldOpenButtonRender: true });
    }
  }

  render() {
    const {
      currentDraft,
      currentUser,
      match,
      draftInfoText,
      shouldDraftViewBlur,
      isFetchingDraft,
      isRefetchOfDraft,
    } = this.props;
    const {
      shouldOpenButtonRender,
      parsedTimeChange,
      timeScheduledReadable,
    } = this.state;
    const {
      uuid,
      name,
      ownerUserId,
      status,
      User: owner,
      Players: players,
      Requests: requests,
      Teams: teams,
    } = currentDraft || {};
    const isUserAlsoOwner = ownerUserId === currentUser.uuid;
    if (
      !isUserAlsoOwner
      && teams
      && !teams.some(team => team.ownerUserId === currentUser.uuid)
    ) {
      return <ErrorIndicator message={ERROR_TEXTS.notAuthorized} />;
    }
    const ownerName = owner && `${owner.firstName} ${owner.lastName}`;
    const { scheduledFor, owner: ownerKey } = profileProperties;
    const readableTime = timeScheduledReadable || DRAFT_UNSCHEDULED;
    const profileCardData = {
      [scheduledFor]: readableTime,
      [ownerKey]: ownerName,
    };
    const profileCardLinkForUpdating = `/drafts/${uuid}/update`;
    const displayType = (
      status === DRAFT_STATUSES.SCHEDULED || status === DRAFT_STATUSES.UNSCHEDULED
        ? DISPLAY_TYPES.TABLE
        : DISPLAY_TYPES.SELECTION_LIST
    );
    return (
      <DraftMenuContainer isWide={displayType === DISPLAY_TYPES.SELECTION_LIST}>
        {(currentDraft && (!isFetchingDraft || isRefetchOfDraft))
        && (
          <div>
            <ProfileCard
              title={name}
              data={profileCardData}
              shouldUpdatingLinkRender={
                [DRAFT_STATUSES.SCHEDULED, DRAFT_STATUSES.UNSCHEDULED].includes(status)
                && isUserAlsoOwner
              }
              linkForUpdating={profileCardLinkForUpdating}
              shouldAdjustWidth={displayType === DISPLAY_TYPES.SELECTION_LIST}
            />
            <div>
              {(shouldOpenButtonRender && status !== DRAFT_STATUSES.OPEN)
              && (
                <div>
                  <Button
                    value={DRAFT_BUTTON_OPEN_TEXT}
                    clickHandler={this.openDraft}
                  />
                </div>
              )}
              <InfoContainer>
                {draftInfoText
                && (
                  <InfoText>
                    {draftInfoText}
                  </InfoText>
                )}
              </InfoContainer>
              {(parsedTimeChange && players.find(player => !player.teamId))
              && (
                <Timer
                  expiryTime={parsedTimeChange}
                  assignPlayerToTeam={this.assignPlayerToTeam}
                />
              )}
              <BlurContainer shouldDraftViewBlur={shouldDraftViewBlur}>
                <Teams
                  parent="draft"
                  match={match}
                  displayType={displayType}
                  teams={teams}
                />
                <Players
                  draft={currentDraft}
                  parent="draft"
                  displayType={displayType}
                  players={players}
                  assignPlayerToTeam={this.assignPlayerToTeam}
                />
              </BlurContainer>
              {(
                isUserAlsoOwner
                && displayType === DISPLAY_TYPES.TABLE
              )
              && <Requests requests={requests} fetchBy="draft" />
              }
            </div>
          </div>
        )}
        {(isFetchingDraft && !isRefetchOfDraft) && <LoadingIndicator />}
      </DraftMenuContainer>
    );
  }
}

DraftMenu.defaultProps = {
  currentDraft: null,
  currentUser: null,
  draftInfoText: null,
  isRefetchOfDraft: null,
};

DraftMenu.propTypes = {
  currentDraft: PropTypes.objectOf(PropTypes.any),
  currentUser: PropTypes.objectOf(PropTypes.any),
  draftInfoText: PropTypes.string,
  fetchOneDraftPropFn: PropTypes.func.isRequired,
  isFetchingDraft: PropTypes.bool.isRequired,
  isRefetchOfDraft: PropTypes.bool,
  match: PropTypes.objectOf(PropTypes.any).isRequired,
  removeCurrentDraftFromState: PropTypes.func.isRequired,
  setDraftInfoTextPropFn: PropTypes.func.isRequired,
  shouldDraftViewBlur: PropTypes.bool.isRequired,
  socket: PropTypes.objectOf(PropTypes.any).isRequired,
  updateDraftPropFn: PropTypes.func.isRequired,
  updatePlayerPropFn: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(DraftMenu);
