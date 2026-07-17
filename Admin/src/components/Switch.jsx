import React from 'react';

const Switch = ({ checked, onChange, id }) => {
  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        id={id}
      />
      <span className="slider" />
    </label>
  );
};

export default Switch;
