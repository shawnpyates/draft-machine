import CreatePlayer from '../CreatePlayer/CreatePlayer';
import CreateTeam from '../CreateTeam/CreateTeam';
import DraftMenu from '../DraftMenu/DraftMenu';
import CreateDraft from '../CreateDraft/CreateDraft';
import TeamMenu from '../TeamMenu/TeamMenu';
import UpdateUser from '../UpdateUser/UpdateUser';

module.exports = [
  {
    path: '/createDrafts',
    component: CreateDraft,
  },
  {
    path: '/createTeams',
    component: CreateTeam,
  },
  {
    path: '/drafts/:id/createTeams',
    component: CreateTeam,
  },
  {
    path: '/updateUser',
    component: UpdateUser,
  },
  {
    path: '/drafts/:id/show',
    component: DraftMenu,
  },
  {
    path: '/drafts/:id/update',
    component: CreateDraft,
  },
  {
    path: '/teams/:id/show',
    component: TeamMenu,
  },
  {
    path: '/teams/:id/createPlayers',
    component: CreatePlayer,
  },
  {
    path: '/drafts/:id/createPlayers',
    component: CreatePlayer,
  },
];
