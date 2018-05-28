import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { header as headerTexts } from '../../../texts.json';

const { title, logOut, notLoggedIn } = headerTexts;
const { localStorage, location } = window;

const Container = styled.header`
  background-color: #11133F;
  height: 130px;
  padding: 20px;
  color: #FFF;

  @media only screen and (min-width: 550px) {
    height: 80px;
  }
`;

const Title = styled.h2`
  display: inline-block;
  font-family: 'La Belle Aurore', sans-serif;
  font-size: 2.5em;
  white-space: no-wrap;
`;

const NavBar = styled.div`
  z-index: 10;
  margin-top: 8px;
  text-align: center;

  @media only screen and (min-width: 550px) {
    float: right;
  }
`;

const NavBarItem = styled.p`
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  text-decoration: none;
  text-align: center;
  margin: auto 15px;
  color: #7EC0EE;

  @media only screen and (min-width: 550px) {
    text-align: right;
  }
`;

const NavBarLogOut = styled(NavBarItem)`
  cursor: pointer;
  color: #FFF;
`;

const Header = ({ currentUser }) => {

  const handleLogOut = () => {
    localStorage.removeItem('drafterUserToken');
    location.reload();
  };

  return (
    <Container>
      <Title>{title}</Title>
      {currentUser &&
        <NavBar>
          <NavBarItem>{currentUser.email}</NavBarItem>
          <NavBarLogOut onClick={handleLogOut}>{logOut}</NavBarLogOut>
        </NavBar>
      }
      {!currentUser &&
        <NavBar>
          <NavBarItem>{notLoggedIn}</NavBarItem>
        </NavBar>
      }
    </Container>
  );
};

Header.defaultProps = {
  currentUser: null,
};

Header.propTypes = {
  currentUser: PropTypes.objectOf(PropTypes.any),
};

export default Header;