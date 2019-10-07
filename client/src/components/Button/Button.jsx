import React from 'react';
import PropTypes from 'prop-types';

import { ButtonInput, ButtonContainer } from './styledComponents';

const Button = ({ value, clickHandler }) => (
  <ButtonContainer>
    <ButtonInput
      type="button"
      value={value}
      onClick={clickHandler}
    />
  </ButtonContainer>
);

Button.defaultProps = {
  clickHandler: null,
};

Button.propTypes = {
  clickHandler: PropTypes.func,
  value: PropTypes.string.isRequired,
};

export default Button;