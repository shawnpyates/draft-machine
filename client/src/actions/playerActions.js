import axios from 'axios';

export const fetchPlayersByDraft = draftId => (dispatch) => {
  dispatch({ type: 'FETCH_PLAYERS_FROM_DRAFT_PENDING' });
  axios.get(`/api/drafts/${draftId}/players`)
    .then((response) => {
      const { players } = response.data;
      const undraftedPlayers = players.filter(p => !p.teamId);
      dispatch({ type: 'FETCH_PLAYERS_FROM_DRAFT_FULFILLED', payload: undraftedPlayers });
    })
    .catch((err) => {
      dispatch({ type: 'FETCH_PLAYERS_FROM_DRAFT_REJECTED', payload: err });
    });
};

export const fetchPlayersByTeam = teamId => (dispatch) => {
  dispatch({ type: 'FETCH_PLAYERS_FROM_TEAM_PENDING' });
  axios.get(`/api/teams/${teamId}/players`)
    .then((response) => {
      const { players } = response.data;
      dispatch({ type: 'FETCH_PLAYERS_FROM_TEAM_FULFILLED', payload: players });
    })
    .catch((err) => {
      dispatch({ type: 'FETCH_PLAYERS_FROM_TEAM_REJECTED', payload: err });
    });
};


export const createPlayer = body => (dispatch) => {
  dispatch({ type: 'CREATE_PLAYER_PENDING' });
  return axios.post('/api/players', body)
    .then(() => {
      dispatch({ type: 'CREATE_PLAYER_FULFILLED' });
    })
    .catch((err) => {
      dispatch({ type: 'CREATE_PLAYER_REJECTED', payload: err });
    });
};

export const updatePlayer = ({
  id,
  body,
  socket,
  draftId,
  teamName,
  playerName,
  isRandomAssignment,
}) => (dispatch) => {
  dispatch({ type: 'UPDATE_PLAYER_PENDING' });
  return axios.put(`/api/players/${id}`, body)
    .then((response) => {
      const { player } = response.data;
      if (socket && teamName) {
        socket.emit('draftSelection', {
          draftId,
          teamName,
          playerName,
          isRandomAssignment,
        });
      }
      dispatch({ type: 'UPDATE_PLAYER_FULFILLED', payload: player });
    })
    .catch((err) => {
      dispatch({ type: 'UPDATE_PLAYER_REJECTED', payload: err });
    });
};

export const fetchOnePlayer = id => (dispatch) => {
  dispatch({ type: 'FETCH_ONE_PLAYER_PENDING' });
  axios.get(`/api/players/${id}`)
    .then((response) => {
      const { player } = response.data;
      dispatch({ type: 'FETCH_ONE_PLAYER_FULFILLED', payload: player });
    })
    .catch((err) => {
      dispatch({ type: 'FETCH_ONE_PLAYER_REJECTED', payload: err });
    });
};

export const removeCurrentPlayerFromState = () => (dispatch) => {
  dispatch({ type: 'REMOVE_CURRENT_PLAYER_FROM_STATE' });
};
